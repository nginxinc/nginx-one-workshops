## Steps to build Azure resources

```bash

export MY_RESOURCEGROUP="s.dutta-SOT"
export MY_LOCATION=centralus

az group create --name $MY_RESOURCEGROUP --location $MY_LOCATION

az network vnet create \
--resource-group $MY_RESOURCEGROUP \
--name sot-vnet \
--address-prefixes 172.16.0.0/16

az network nsg create \
--resource-group $MY_RESOURCEGROUP \
--name sot-nsg

az network vnet subnet create \
--resource-group $MY_RESOURCEGROUP \
--name sot-vm-subnet \
--vnet-name sot-vnet \
--address-prefixes 172.16.2.0/24

ID=`az group show -n $MY_RESOURCEGROUP --query "id" -otsv`

az vm create \
    --resource-group $MY_RESOURCEGROUP \
    --name sot-elasticvm \
    --image Ubuntu2204 \
    --admin-username azureuser \
    --vnet-name sot-vnet \
    --subnet sot-vm-subnet \
    --assign-identity \
    --scope $ID \
    --role Owner \
    --generate-ssh-keys \
    --public-ip-sku Standard \
    --security-type TrustedLaunch \
    --enable-secure-boot true \
    --enable-vtpm true 

```

## Steps to install elasticsearch within Azure VM

1. Install elasticsearch

    ```bash
    sudo apt update && sudo apt install -y openjdk-11-jdk
    wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
    sudo apt-add-repository "deb https://artifacts.elastic.co/packages/8.x/apt stable main"
    sudo apt update && sudo apt install -y elasticsearch
    ```

1. Once elasticsearch has been installed, update elasticsearch config file

    ```bash
    sudo vi /etc/elasticsearch/elasticsearch.yml
    ```

    Set below variables

    ```bash
    network.host: <Public IP of VM>
    http.port: 9200

    xpack.security.enabled: false
    xpack.security.enrollment.enabled: false
    ```

1. Enable and start elasticsearch

    ```bash
    sudo systemctl enable elasticsearch
    sudo systemctl start elasticsearch
    ```

1. All elasticsearch tools/executables location

    ```bash
    /usr/share/elasticsearch/bin
    ```

1. Create a new user

    ```bash
    ./elasticsearch-users useradd filebeat -p <pswd> -r beats_admin
    ```

1. List users:

    ```bash
    ./elasticsearch-users list
    ```

## Steps to setup local client vm

1. Install nginx oss to run a nginx webserver

    ```bash
    sudo apt install curl gnupg2 ca-certificates lsb-release ubuntu-keyring

    curl https://nginx.org/keys/nginx_signing.key | gpg --dearmor \
    | sudo tee /usr/share/keyrings/nginx-archive-keyring.gpg >/dev/null

    gpg --dry-run --quiet --no-keyring --import --import-options import-show /usr/share/keyrings/nginx-archive-keyring.gpg

    echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
    http://nginx.org/packages/ubuntu `lsb_release -cs` nginx" \
    | sudo tee /etc/apt/sources.list.d/nginx.list

    echo -e "Package: *\nPin: origin nginx.org\nPin: release o=nginx\nPin-Priority: 900\n" \
    | sudo tee /etc/apt/preferences.d/99nginx

    sudo apt update
    sudo apt install nginx

    sudo nginx
    ```

1. Check if nginx oss installed properly

    ```bash
    curl -I localhost
    ```

## Steps to setup log Server vm

### Syslog setup

1. On a default Ubuntu server, rsyslog should already be installed.  To configure you can edit the main config file:

    ```bash
    vi /etc/rsyslog.conf
    ```

1. Uncomment the modules for reception of UDP and TCP traffic. Add a template and then a rule to accept everything following that template.

    The final file looks like:

    ```bash
    # /etc/rsyslog.conf configuration file for rsyslog
    #
    # For more information install rsyslog-doc and see
    # /usr/share/doc/rsyslog-doc/html/configuration/index.html
    #
    # Default logging rules can be found in /etc/rsyslog.d/50-default.conf


    #################
    #### MODULES ####
    #################

    module(load="imuxsock") # provides support for local system logging
    #module(load="immark")  # provides --MARK-- message capability

    # provides UDP syslog reception 
    module(load="imudp") 
    input(type="imudp" port="514") 

    # provides TCP syslog reception
    module(load="imtcp") 
    input(type="imtcp" port="514") 

    # provides kernel logging support and enable non-kernel klog messages
    module(load="imklog" permitnonkernelfacility="on")

    ###########################
    #### GLOBAL DIRECTIVES ####
    ###########################

    #
    # Use traditional timestamp format.
    # To enable high precision timestamps, comment out the following line.
    #
    $ActionFileDefaultTemplate RSYSLOG_TraditionalFileFormat

    # Filter duplicated messages
    $RepeatedMsgReduction on

    #
    # Set the default permissions for all log files.
    #
    $FileOwner syslog
    $FileGroup adm
    $FileCreateMode 0640
    $DirCreateMode 0755
    $Umask 0022
    $PrivDropToUser syslog
    $PrivDropToGroup syslog

    #
    # Where to place spool and state files
    #
    $WorkDirectory /var/spool/rsyslog

    #
    # Include all config files in /etc/rsyslog.d/
    #
    $IncludeConfig /etc/rsyslog.d/*.conf

    #
    # Add a template for log storage
    #
    $template remote-incoming-logs, "/var/log/%HOSTNAME%/%PROGRAMNAME%.log"

    #
    # Add a rule for log reception and storage
    #
    *.* ?remote-incoming-logs
    ```

1. Restart the service:

    ```bash
    root@ubuntu:/etc# systemctl restart rsyslog
    root@ubuntu:/etc# systemctl status rsyslog
    ● rsyslog.service - System Logging Service
        Loaded: loaded (/lib/systemd/system/rsyslog.service; enabled; vendor preset: enabled)
        Active: active (running) since Fri 2025-02-21 16:53:08 UTC; 3s ago
    TriggeredBy: ● syslog.socket
        Docs: man:rsyslogd(8)
                man:rsyslog.conf(5)
                https://www.rsyslog.com/doc/
    Main PID: 1744 (rsyslogd)
        Tasks: 10 (limit: 7134)
        Memory: 1.4M
            CPU: 6ms
        CGroup: /system.slice/rsyslog.service
                └─1744 /usr/sbin/rsyslogd -n -iNONE

    Feb 21 16:53:08 ubuntu systemd[1]: Starting System Logging Service...
    Feb 21 16:53:08 ubuntu rsyslogd[1744]: imuxsock: Acquired UNIX socket '/run/systemd/journal/syslog' (fd 3) from systemd.  [v8.2112.0]
    Feb 21 16:53:08 ubuntu systemd[1]: Started System Logging Service.
    Feb 21 16:53:08 ubuntu rsyslogd[1744]: rsyslogd's groupid changed to 111
    Feb 21 16:53:08 ubuntu rsyslogd[1744]: rsyslogd's userid changed to 104
    Feb 21 16:53:08 ubuntu rsyslogd[1744]: [origin software="rsyslogd" swVersion="8.2112.0" x-pid="1744" x-info="https://www.rsyslog.com"] start
    ```

1. Open the firewall for port 514 (tcp & udp)

    ```bash
    root@ubuntu:/etc# ufw allow 514/tcp
    Rules updated
    Rules updated (v6)
    root@ubuntu:/etc# ufw allow 514/udp
    Rules updated
    Rules updated (v6)
    ```

1. Confirm that ryslog is listening:

    ```bash
    root@ubuntu:/etc/rsyslog.d# ss -tulpn | grep syslog
    udp   UNCONN 0      0            0.0.0.0:514        0.0.0.0:*    users:(("rsyslogd",pid=1744,fd=5))       
    udp   UNCONN 0      0                  *:514              *:*    users:(("rsyslogd",pid=1744,fd=6))       
    tcp   LISTEN 0      25           0.0.0.0:514        0.0.0.0:*    users:(("rsyslogd",pid=1744,fd=7))       
    tcp   LISTEN 0      25              [::]:514           [::]:*    users:(("rsyslogd",pid=1744,fd=8))
    ```

1. The server should now be set to receive logs.

### Filebeat setup

1. Install filebeat

    ```bash
    wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
    
    echo "deb https://artifacts.elastic.co/packages/8.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-8.x.list

    sudo apt update
    sudo apt install -y filebeat
    ```

1. Enable and start filebeat

    ```bash
    sudo systemctl enable filebeat
    sudo systemctl start filebeat
    ```

1. Once filebeat has been installed, update filebeat config file

    ```bash
    sudo vi /etc/filebeat/filebeat.yml
    ```

    Make below changes if your usecase is file based log streaming

    ```bash
    filebeat.inputs:
      - type: log
        enabled: true
        paths:
          - "/path/to/nginx_logs/access.log"

    setup.template.name: "filebeat-index"
    setup.template.pattern: "filebeat-index-*"
    setup.template.enabled: true
    output.elasticsearch:
        hosts: ["http://<your-elasticsearch-ip>:9200"]
        index: "filebeat-index-%{+yyyy.MM.dd}"
        username: "yourusername"
        password: "yourpassword"
    ```

    Make below changes if your usecase is syslog based log streaming

    ```bash
    filebeat.inputs:
      - type: syslog
        enabled: true
        paths:
          - "/var/log/syslog"

    setup.template.name: "filebeat-index"
    setup.template.pattern: "filebeat-index-*"
    setup.template.enabled: true
    output.elasticsearch:
        hosts: ["http://elastic.example.com:9200"]
        index: "filebeat-index-%{+yyyy.MM.dd}"
        username: "filebeat"
        password: "<password>"
    ```

1. Restart filebeat

    ```bash
    sudo systemctl restart filebeat
    ```

## Adam's testing commands to run on elasticsearch

```bash
Get the elasticsearch cluster health:
-------------------------------------
(For making calls from elastic vm use): curl -X GET "http://localhost:9200/_cluster/health?pretty"

(For making calls from any other vm/local machine use): curl -X GET "http://<public IP of VM>:9200/_cluster/health?pretty"


List all indices:
--------------------------------------------------------------------------
curl 'http://13.89.102.212:9200/_cat/indices?pretty'

yellow open .ds-filebeat-index-2025.02.06-2025.02.06-000001 -ySc8wEnTouvIqml59Z68g 1 1 19 0 19.4kb 19.4kb 19.4kb
yellow open dummy-data                                      oN6fgb-BQDGW4JdrTzmLVA 1 1 26 0 18.9kb 18.9kb 18.9kb

List all data streams
--------------------------------------------------------------------------
curl -X GET "http://13.89.102.212:9200/_data_stream?pretty"


Examine the dummy-data index:
--------------------------------------------------------------------------
curl -X GET "http://13.89.102.212:9200/dummy-data/_search?pretty" -H 'Content-Type: application/json' -d'{ "query": { "match_all" : {} }}'


Examine the dummy-data to fetch logs where value is <Value>
--------------------------------------------------------------------------
curl -X GET "http://13.89.102.212:9200/dummy-data/_search?pretty" -H 'Content-Type: application/json' -d'{ "query": { "match" : {"value": 43} }}'


Examine the filebeat-index-* index:
--------------------------------------------------------------------------
curl -X GET "http://13.89.102.212:9200/filebeat-index-*/_search?pretty" -H 'Content-Type: application/json' -d'{ "query": { "match_all" : {} }}'

Examine the filebeat-index-* to fetch logs where id is <Value>
--------------------------------------------------------------------------
curl -X GET "http://13.89.102.212:9200/filebeat-index-*/_search?pretty" -H 'Content-Type: application/json' -d'{ "query": { "match" : {"_id": "4jKX3ZQB09GoHhCeDVSD"} }}'

Examine the filebeat-index-* to fetch logs for a particular date
--------------------------------------------------------------------------
curl -X GET "http://13.89.102.212:9200/filebeat-index-*/_search?pretty" -H 'Content-Type: application/json' -d'{ "query": { "range" : {"@timestamp": {"gte":"2025-02-07T00:00:00","lte": "2025-02-07T23:59:59"} }}}'

From Jumphost sending request passing through NGINXPlus
--------------------------------------------------------------------------
curl -X GET "http://elastic.example.com:9200/filebeat-index-*/_search?pretty" -H 'Content-Type: application/json' -d'{ "query": { "range" : {"@timestamp": {"gte":"2025-02-07T00:00:00","lte": "2025-02-07T23:59:59"} }}}'

Examine the filebeat-index-* to fetch logs for a particular date and also filter based on hostname
-------------------------------------------------------------------------------------------------------
curl -X GET "http://elastic.example.com:9200/filebeat-index-*/_search?pretty" \
-H 'Content-Type: application/json' -d'{
  "query": {
    "bool": {
      "must": [
        {
          "range": {
            "@timestamp": {
              "gte": "2025-02-21T00:00:00",
              "lte": "2025-02-21T23:59:59"
            }
          }
        },
        {
          "match": {
            "host.hostname": "BackendApp"
          }
        }
      ]
    }
  }
}'


Delete a particular data stream
--------------------------------------------------------------------------
curl -X DELETE "http://13.89.102.212:9200/_data_stream/filebeat-index-2025.02.21"
```

## Setup mock Action1 server in Azure

1. Create a new Azure vm

    ```bash
    export MY_RESOURCEGROUP="s.dutta-SOT"
    export MY_LOCATION=centralus
    export ID=`az group show -n $MY_RESOURCEGROUP --query "id" -otsv`

    az vm create \
        --resource-group $MY_RESOURCEGROUP \
        --name sot-action1vm \
        --image Ubuntu2204 \
        --admin-username azureuser \
        --vnet-name sot-vnet \
        --subnet sot-vm-subnet \
        --assign-identity \
        --scope $ID \
        --role Owner \
        --generate-ssh-keys \
        --public-ip-sku Standard \
        --security-type TrustedLaunch \
        --enable-secure-boot true \
        --enable-vtpm true 
    ```

1. SSH into the new Azure VM and install nginx oss to run a nginx webserver

    ```bash
    sudo apt install curl gnupg2 ca-certificates lsb-release ubuntu-keyring

    curl https://nginx.org/keys/nginx_signing.key | gpg --dearmor \
    | sudo tee /usr/share/keyrings/nginx-archive-keyring.gpg >/dev/null

    gpg --dry-run --quiet --no-keyring --import --import-options import-show /usr/share/keyrings/nginx-archive-keyring.gpg

    echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
    http://nginx.org/packages/ubuntu `lsb_release -cs` nginx" \
    | sudo tee /etc/apt/sources.list.d/nginx.list

    echo -e "Package: *\nPin: origin nginx.org\nPin: release o=nginx\nPin-Priority: 900\n" \
    | sudo tee /etc/apt/preferences.d/99nginx

    sudo apt update
    sudo apt install nginx

    sudo nginx
    ```

1. Modify the /etc/nginx/conf.d/default.conf file to listen on port 22543 instead of port 80

    ```bash
    server {
        listen       22543;
        server_name  localhost;
    
        ...

    }
    ```

1. Reload the updated config and test it out within the Azure VM

    ```bash
    nginx -s reload
    curl localhost:22543
    ```

1. Update `sot-action1vmNSG` which is the network security group attached to the new Azure vm to open port `22543` for your IP.

1. Add a stream block in the `nginx.conf` within nginxplus instance as shown below.

    ```bash
    
    ...

    # TCP/UDP proxy and load balancing block

    stream {
        include  /etc/nginx/stream/*.conf;

        log_format  stream  '$remote_addr - $server_addr [$time_local] $status $upstream_addr $upstream_bytes_sent';

        access_log  /var/log/nginx/stream.log  stream;
    }

    ...

    ```

1. Also create a `stream` subfolder within `/etc/nginx` folder and then add `action1.example.com.conf` and `stream-upstreams.conf` files as part of the subfolder.
