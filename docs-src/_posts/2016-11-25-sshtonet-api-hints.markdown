---
layout: post
title:  SshTo.net API hints
categories: 
    - sshtonet-usage
tags: 
    - beta
prism: true
author: Andrew Gryaznov
comments: true
---

This article covers current web API that is used by SshTo.net web interface to request temporary ports for forwarded connections. The full API is currenlty work-in-progress but you can still use this web API to access basic functions of SshTo.net programmatically.

Our full API will allow to securely ask for external port and to access your ports using long-runnig user-controlled tokens. But as of today, only JWT authentication is supported and tokens expire in about half a year. You can get a new token by authenticating at the main [sshto.net][sshtonet] website and clicking any of the "API" links on the site.

## API Usage

SshTo.net web API allows to request temporary port using a simple GET port to the address of the form 

    /<your_email>/<machine_id>

where `machine_id` is ID of your machine that you supplied as ssh port forwarding parameters.

### JSON format

You can send request like 

    wget -q -O - 'https://sshto.net/YOUR_EMAIL/1?token=YOUR_TOKEN'
    
where `1` is your machine ID, to get JSON of your opened port of the format 

    { "port": 34567 }

### Plain format

Plain format is useful when you want to execute command on your remote machine using a bash script one-liner. As the only returned value will be the port number - you can directly use it in the script.

To get port in plain text format, set `Content-Type: text/plain` HTTP request header. 

Here is the general pattern if you want to execute a command `"foo"` on your machine:

    ssh -l user sshto.net "foo" -p $(curl -s -H "Content-Type: text/plain" https://sshto.net/YOUR_EMAIL/1?token=YOUR_TOKEN)
    
[sshtonet]: https://www.sshto.net