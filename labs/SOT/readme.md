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

## Steps to install elastic within Azure VM

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

## Steps to local client vm

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

    Make below changes

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

## Adam's testing commands to run on elasticsearch

```bash
Get the elasticsearch cluster health:
-------------------------------------
(For making calls from elastic vm use): curl -X GET "http://localhost:9200/_cluster/health?pretty"

(For making calls from any other vm/local machine use): curl -X GET "http://<public IP of VM>:9200/_cluster/health?pretty"


Get indices:
-------------------------------------
curl 'http://13.89.102.212:9200/_cat/indices?pretty'

yellow open .ds-filebeat-index-2025.02.06-2025.02.06-000001 -ySc8wEnTouvIqml59Z68g 1 1 19 0 19.4kb 19.4kb 19.4kb
yellow open dummy-data                                      oN6fgb-BQDGW4JdrTzmLVA 1 1 26 0 18.9kb 18.9kb 18.9kb


Examine the dummy-data index:
-------------------------------------
curl -X GET "http://13.89.102.212:9200/dummy-data/_search?pretty" -H 'Content-Type: application/json' -d'{ "query": { "match_all" : {} }}'


Examine the dummy-data to fetch logs where value is <Value>
-------------------------------------
curl -X GET "http://13.89.102.212:9200/dummy-data/_search?pretty" -H 'Content-Type: application/json' -d'{ "query": { "match" : {"value": 43} }}'

Examine the filebeat-index-* index:
-------------------------------------
curl -X GET "http://13.89.102.212:9200/filebeat-index-*/_search?pretty" -H 'Content-Type: application/json' -d'{ "query": { "match_all" : {} }}'

Examine the filebeat-index-* to fetch logs where id is <Value>
-------------------------------------
curl -X GET "http://13.89.102.212:9200/filebeat-index-*/_search?pretty" -H 'Content-Type: application/json' -d'{ "query": { "match" : {"_id": "4jKX3ZQB09GoHhCeDVSD"} }}'

Examine the filebeat-index-* to fetch logs for a particular date
-------------------------------------
curl -X GET "http://13.89.102.212:9200/filebeat-index-*/_search?pretty" -H 'Content-Type: application/json' -d'{ "query": { "range" : {"@timestamp": {"gte":"2025-02-07T00:00:00","lte": "2025-02-07T23:59:59"} }}}'

From Jumphost sending request passing through NGINXPlus
-------------------------------------
curl -X GET "http://elastic.example.com:9200/filebeat-index-*/_search?pretty" -H 'Content-Type: application/json' -d'{ "query": { "range" : {"@timestamp": {"gte":"2025-02-07T00:00:00","lte": "2025-02-07T23:59:59"} }}}'

```
