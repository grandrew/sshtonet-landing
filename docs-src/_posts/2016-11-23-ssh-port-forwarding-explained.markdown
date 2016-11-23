---
layout: post
title:  SSH port forwarding explained in diagrams and tables
categories: 
    - general-documentation
tags: 
    - windows
    - linux 
    - embedded 
thumbnail: /img/ssh-local-forward-process.png
cover: /img/ssh-local-forward-process.png
prism: true
author: Andrew Gryaznov
---

In this article I will be discussing port forwarding techniques in regard to circumventing firewalls, NAT, and overcoming general network topology problems. For example, you may have a machine that does not have a globally-addressable IP but you want to be able to access it via internet from anywhere in the world, or you may want to access local port service that is only accessible at localhost address on your development server (like test flask server, or test docker showcase service, etc.).


Port forwarding vs. tunneling
-----------------------------

There are two most popular general ways to use SSH to create a logical network topology on top of current network configuration (aka software-defined network): **port forwarding** and **tunneling**. 
The difference between these is described in the following table: 

|                        | Tunneling                             | Port forwarding                             |
|------------------------|---------------------------------------|---------------------------------------------|
| System interface       | virutal network card, user process    | user process                                |
| Principle of operation | encapsulates raw packets like VPN     | connects to a specific port as proxy server |
| Configuration required | ip address, routing, (firewall rules) | knowing your ports                          |

In this article I will cover port forwarding techniques and I will be primarily discussing OpenSSH 6.6p1

Types of SSH port forwarding
----------------------------

SSHv2 protocol defines three network port forwarding features: **Local**, **Remote**, and **Dynamic**. *Local* and *Dynamic* modes may in some situations be used to solve similar problems while *Remote* operation type is completely different. The main difference from the user view perspective is that in case of *Local* and *Dynamic* port forwarding modes you connect to your local port that your ssh client has created and ssh server then interprets your request to connect to further ports at the other side, while when you request a *Remote*  port forwarding with your ssh client - the ssh client connects to some of your local ports by itself when a remote ssh server requests such a connection.

These differences from the perspective of a user launching an ssh client are outlined in the table below:

|                 | Remote fwd                                                                                                                                                                                       | Local fwd                                                                                                                                                                                                    | Dymamic fwd                                                                                          |
|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| ssh client does | starts waiting for remote server request, then connects to port (and optionally host) defined as command line parameters locally                                                                 | creates a listening daemon at the machine where you executed it, then sends a request to ssh server to establish a connection where you asked at command line parameters when a local connection is received | starts a local SOCKS protocol proxy daemon at the port you requested, at the host that you executed  |
| ssh server does | creates a listening daemon on port requested by client and when connection establishes it asks the client ssh to connect to host and port defined as command line parameters, at the client side | starts waiting for client request and connects on its own to the destination that you reqested to forward the data                                                                                           | starts listening for requests from client to connect to hosts and ports that SOCKS protocol tells it |

I will cover two types of configuration: Local and Remote (also sometimes called Reverse) port forwarding. Dynamic (or SOCKS) port forwarding may be interesting to create full proxies - for example, if you want to use alternative transmission methods such as IPv6 or multipath TCP (MPTCP) between the client and hosts and use server as a proxy or a gateway to the other medium or transmission protocol (like going from MPTCP or IPv6 back to normal TCP/IPv4).

How does Local port forwarding work?
------------------------------------

I will explain it based on this real-world scenario: 

I run a Flask development server in the cloud VPS server on `localhost:8080` and as it is a debug-only server I can not expose it to the internet. I am going to use Local SSH port forwarding to access the Flask server as if it was running on my local machine (or maybe I'd like show it to my collegues on my local network)

![server local SSH port forwarding scenario]({{ site.baseurl }}/img/ssh-explained-scenario.png "Flask server local SSH port forwarding to cloud server localhost")

The correct invocation pattern for ssh client on your local machine (Mac, Linux, Chromebook, etc.) will be: 

{% highlight bash %}
ssh -N -L localhost:8000:localhost:8080 -l user remote.example.com
{% endhighlight %}

where `-N` tells ssh client not to enter interactive shell mode and `-L` tells to set up a Local port forwarding. The local SSH will listen to connections on port `8000` 
so that if I point my browser to `http://localhost:8000` I will reach my Flask server at `localhost:8080` at the remote machine.

Here is what will happen in this scenario:

![process diagram for local port forwarding]({{ site.baseurl }}/img/ssh-local-forward-process-diagram.svg "Process diagram of browser connecting to local host with ssh local port forwarding set up")

You may further modify this example to use `-L 0.0.0.0:8000:localhost:8080` to tell local ssh client to listen on all interfaces globally on your local machine. This way you will be able to connect to your local machine as if it had the flask server installed on port 8000. For example, it may be useful if you want to show your Flask app to your collegues or to test from your local devices like smartphone or IoT device.

How does Remote port forwarding work?
-------------------------------------

I will explain this using the following real-world scenario:

I want to access SSH shell of my Raspberry PI that has access to the internet via my home wi-fi router using sshto.net free ssh server. 


![remote SSH port forwarding scenario]({{ site.baseurl }}/img/ssh-remote-port-forward.png "RPI connects to sshto.net SSH server and requests remote port forwarding")

Another example is that I want to access my virtual machine SSH shell at my GCE account that does not have an external IP address associated with it 
(I want to save some money and save internet by not requesting another IPv4 address for my test machine)

I will cover both examples as they are essentially the same.

In order for Remote port forwarding to work for this example - this time you will need to execute SSH client at the Raspberry PI (or at the cloud VPS for second scenario).

{% highlight bash %}
ssh -N -R 0.0.0.0:8022:localhost:22 -l user remote.example.com
{% endhighlight %}

This command will tell remote ssh server to open a listening port al `0.0.0.0:8022` which means that it will be globally accessible to the network your server is connected to and the server will then request your client to connect to your local port 22. So that if you want to connect to your RPI you will be entering your server address and port 8022:


![process diagram for remote port forwarding]({{ site.baseurl }}/img/ssh-remote-forward-process-diagram.svg "Process diagram of PuTTY connecting to sshto.net host with ssh remote port forwarding set up")

[sshto.net][sshtonet] provides a free ssh remote port forwarding service so that you can directly execute

{% highlight bash %}
ssh -N -R 1:0:localhost:22 -l myemail@example.com sshto.net
{% endhighlight %}

You will have to [Sign up][sshtonet] first to enable your email login. 

SshTo.net uses first parameter `"1:"` that is normally used to indicate interface to listen to at the server side to indicate the ID of your machine rather than what it is intended for as it will always listen to internet interface. Also, by supplying `:0:` as remote port you ask the ssh server to choose remote port automatically, hence `-R 1:0:localhost:22` - this is a standard SSHv2 server feature too. In our examples for remote port forwarding we listen to `0.0.0.0:8022:localhost:22` which means any interface and port 8022.

An even more easy-to-remember pattern looks like

{% highlight bash %}
ssh -NR 1:0:0:22 -l email sshto.net
{% endhighlight %}

because OpenSSH client by default connects to `localhost` and supports parameter shorting you can just use `-NR 1:0:0:22`

Security considerations
-----------------------

It is important to know that opening your local ports to the internet is potentially dangerous as you will most likely not maintain an up-to-date security configuration on your local PC or IoT device. This means that permanently remote-forwarded port of your application is a high risk. 

This is why [SshTo.net][sshtonet] asks web authentication to request an open port for a limited amount of time using web interface or API.

[sshtonet]: https://www.sshto.net
