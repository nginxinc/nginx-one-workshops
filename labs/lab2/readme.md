# Build workshop components within Docker

## Introduction

In this lab, you will be running the backend application and several NGINX OSS and Plus instances as Docker containers. All the NGINX containers would be attached to NGINX One Console as part of this exercise.

<br/>

## Prerequisites

- You must have an F5 Distributed Cloud(XC) Account
- You must have enabled NGINX One service on F5 Distributed Cloud(XC)
- You must have Docker and Docker Compose installed and running
- You must have an Active Data Plane Key from previous exercise
- See `Lab0` for instructions on setting up your system for this Workshop
- Familiarity with basic Linux concepts and commands
- Familiarity with basic NGINX concepts and commands

<br/>

### Run NGINX Containers with Docker

|                NGINX Plus                |              Docker              |             NGINX OSS              |
| :--------------------------------------: | :------------------------------: | :--------------------------------: |
| ![NGINX Plus](media/nginx-plus-icon.png) | ![Docker](media/docker-icon.png) | ![NGINX OSS](media/nginx-icon.png) |

You will run some Docker containers to build out various workshop components, using the provided `docker-compose.yml` file. This Docker Compose will pull and run 9 different Docker Containers, as follows:

- 3 NGINX OSS Containers, with different OS and NGINX versions, connecting to the NGINX One Console
- 3 NGINX Plus Containers, with different OS and NGINX versions, connecting to the NGINX One Console
- 3 nginxinc/ingress-demo Containers, used for the backend web servers, but NOT connected to the NGINX One Console

1. Inspect the `lab2/docker-compose.yml` file. You will see the details of each container being pulled and run.

   > Before you can pull and run these containers, you must set several Environment variables correctly, _before running docker compose_.

1. Using the Visual Studio Terminal, set the `TOKEN` environment variable with the Dataplane Key from the NGINX One Console, as follows:

   ```bash
   export TOKEN=paste-your-dataplane-key-from-clipboard-here
   ```

   And verify it was set:

   ```bash
   #check it
   echo $TOKEN
   ```

   ```bash
   ## Sample output ##
   vJ+ADwlFXKf58bX0Qk/...6N38Al4fdxXDefT6J2iiM=
   ```

1. Using the same Terminal, set the `JWT` environment variable from your `nginx-repo.jwt` license file. This is required to pull the NGINX Plus container images from the NGINX Private Registry. If you do not have an NGINX Plus license, you can request a free 30-Day Trial license from here: <https://www.f5.com/trials/nginx-one>

   ```bash
   export JWT=$(cat lab2/nginx-repo.jwt)
   ```

   And verify it was set:

   ```bash
   #check it
   echo $JWT
   ```

1. Using the same Terminal, set the `NAME` environment variable with your `initials.lastname`(or any unique value). This is needed if you are using a shared tenant within Distributed Cloud to differentiate your dataplane instance from other attendees.

   ```bash
   # Replace <YOUR_INITIALS.LASTNAME> with proper value (eg. s.jobs)
   export NAME=<YOUR_INITIALS.LASTNAME>
   ```

   And verify it was set:

   ```bash
   #check it
   echo $NAME
   ```

1. Using Docker, Login to to the NGINX Private Registry, using the $JWT ENV variable for the username, as follows. (Your system may require sudo):

   ```bash
   docker login private-registry.nginx.com --username=$JWT --password=none
   ```

   You should see a `Login Suceeded` message, like this:

   ```bash
   ##Sample output##
   WARNING! Using --password via the CLI is insecure. Use --password-stdin.
   WARNING! Your password will be stored unencrypted in /home/ubuntu/.docker/config.json.
   Configure a credential helper to remove this warning. See
   https://docs.docker.com/engine/reference/commandline/login/#credentials-store

   Login Succeeded
   ```

1. Change to lab2 folder for these exercises.

   ```bash
   cd lab2
   ```

1. Run the script below to generate temporary self-signed certificates that would be used by NGINX OSS instances.  Ensure you are in the `/lab2` folder:

   ```bash
   
   bash generate_certs.sh
   ```

1. If both ENV variables are set correctly && you are logged into the NGINX Private Registry, you can now run Docker Compose to pull and run the images. Ensure you are in the `/lab2` folder:

   ```bash
   docker compose up --force-recreate -d
   ```

   You will see Docker pulling the images, and then starting the containers.

   ![Docker Pulling](media/lab2_docker-pulling.png)

   ```bash
   ## Sample output ##
   [+] Running 10/10
    ✔ Network lab2_default          Created                                                         0.0s
    ✔ Container s.jobs-plus3        Started                                                         0.4s
    ✔ Container s.jobs-plus1        Started                                                         0.4s
    ✔ Container s.jobs-web3         Started                                                         0.3s
    ✔ Container s.jobs-oss1         Started                                                         0.4s
    ✔ Container s.jobs-web1         Started                                                         0.3s
    ✔ Container s.jobs-oss2         Started                                                         0.4s
    ✔ Container s.jobs-oss3         Started                                                         0.4s
    ✔ Container s.jobs-web2         Started                                                         0.3s
    ✔ Container s.jobs-plus2        Started                                                         0.4s
   ```

1. Verify that all 9 containers started:

   ```bash
   docker ps | grep $NAME
   ```

   ```bash
   ##Sample output##

   CONTAINER ID   IMAGE                                                                             COMMAND                  CREATED          STATUS          PORTS                                                                                                                                                                          NAMES
   # NGINX OSS containers
   00ee8c9e4326   docker-registry.nginx.com/nginx/agent:mainline                                    "/docker-entrypoint.…"   44 minutes ago   Up 44 minutes   0.0.0.0:33396->80/tcp, :::33395->80/tcp, 0.0.0.0:33393->443/tcp, :::33392->443/tcp, 0.0.0.0:33388->9000/tcp, :::33387->9000/tcp, 0.0.0.0:33381->9113/tcp, :::33380->9113/tcp   s.jobs-oss1
   34b871d50d1b   docker-registry.nginx.com/nginx/agent:alpine                                      "/docker-entrypoint.…"   44 minutes ago   Up 44 minutes   0.0.0.0:33391->80/tcp, :::33390->80/tcp, 0.0.0.0:33385->443/tcp, :::33384->443/tcp, 0.0.0.0:33378->9000/tcp, :::33377->9000/tcp, 0.0.0.0:33375->9113/tcp, :::33374->9113/tcp   s.jobs-oss2
   022d79ce886c   docker-registry.nginx.com/nginx/agent:1.26-alpine                                 "/docker-entrypoint.…"   44 minutes ago   Up 44 minutes   0.0.0.0:33398->80/tcp, :::33397->80/tcp, 0.0.0.0:33395->443/tcp, :::33394->443/tcp, 0.0.0.0:33392->9000/tcp, :::33391->9000/tcp, 0.0.0.0:33386->9113/tcp, :::33385->9113/tcp   s.jobs-oss3

   # NGINX Plus containers
   9770a4169e19   private-registry.nginx.com/nginx-plus/agent:nginx-plus-r32-alpine-3.20-20240613   "/usr/bin/supervisor…"   44 minutes ago   Up 44 minutes   0.0.0.0:33397->80/tcp, :::33396->80/tcp, 0.0.0.0:33394->443/tcp, :::33393->443/tcp, 0.0.0.0:33389->9000/tcp, :::33388->9000/tcp, 0.0.0.0:33383->9113/tcp, :::33382->9113/tcp   s.jobs-plus1
   852667e29280   private-registry.nginx.com/nginx-plus/agent:nginx-plus-r31-alpine-3.19-20240522   "/usr/bin/supervisor…"   44 minutes ago   Up 44 minutes   0.0.0.0:33382->80/tcp, :::33381->80/tcp, 0.0.0.0:33377->443/tcp, :::33376->443/tcp, 0.0.0.0:33374->9000/tcp, :::33373->9000/tcp, 0.0.0.0:33372->9113/tcp, :::33371->9113/tcp   s.jobs-plus2
   ffa65b04e03b   private-registry.nginx.com/nginx-plus/agent:nginx-plus-r31-ubi-9-20240522         "/usr/bin/supervisor…"   44 minutes ago   Up 44 minutes   0.0.0.0:33373->80/tcp, :::33372->80/tcp, 0.0.0.0:33371->443/tcp, :::33370->443/tcp, 0.0.0.0:33370->9000/tcp, :::33369->9000/tcp, 0.0.0.0:33369->9113/tcp, :::33368->9113/tcp   s.jobs-plus3

   # NGINX Ingress Demo containers (not Registered with NGINX One Console)
   37c2777c8598   nginxinc/ingress-demo                                                             "/docker-entrypoint.…"   44 minutes ago   Up 44 minutes   0.0.0.0:33387->80/tcp, :::33386->80/tcp, 0.0.0.0:33379->443/tcp, :::33378->443/tcp                                                                                             s.jobs-web1
   dba569e76e36   nginxinc/ingress-demo                                                             "/docker-entrypoint.…"   44 minutes ago   Up 44 minutes   443/tcp, 0.0.0.0:33390->80/tcp, :::33389->80/tcp, 0.0.0.0:33384->433/tcp, :::33383->433/tcp                                                                                    s.jobs-web2
   5cde3c462a27   nginxinc/ingress-demo                                                             "/docker-entrypoint.…"   44 minutes ago   Up 44 minutes   0.0.0.0:33380->80/tcp, :::33379->80/tcp, 0.0.0.0:33376->443/tcp, :::33375->443/tcp                                                                                             s.jobs-web3
   ```

   Go back to your NGINX One Console Instance page, and click `Refresh`. In the search box type in your `$NAME` value to search your instances. You should see all 6 of your instances appear in the list, and the Online icon should be `green`. If they did not Register with the One Console, it is likely you have an issue with the $TOKEN used, create a new Dataplane Key and try again. It should look similar to this:

   ![NGINX Instances](media/lab2_none-instances.png)

Now that the NGINX OSS and Plus containers are running and Registered with the NGINX One Console, in subsequent sections you will explore the various features of NGINX One Console, and manage your NGINX Instances!

<br/>

This ends lab2.

<br/>

## References

- [NGINX One Console](https://docs.nginx.com/nginx-one/)
- [NGINX Agent](https://docs.nginx.com/nginx-agent/overview/)

<br/>

### Authors

- Chris Akker - Solutions Architect - Community and Alliances @ F5, Inc.
- Shouvik Dutta - Solutions Architect - Community and Alliances @ F5, Inc.
- Adam Currier - Solutions Architect - Community and Alliances @ F5, Inc.

---

Navigate to ([Lab3](../lab3/readme.md) | [LabGuide](../readme.md))

