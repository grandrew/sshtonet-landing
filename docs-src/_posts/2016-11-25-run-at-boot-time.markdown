---
layout: post
title:  How to run ssh port forwarding at boot time
categories: 
    - sshtonet-usage
tags: 
    - windows
    - mac
    - linux
    - embedded
prism: true
author: Andrew Gryaznov
comments: true
---

This article briefly covers methods to run ssh forwarding at boot time on various platforms.

## Connect at boot time


First of all, you need to accept the sshto.net host key. Do this by running the basic port forward code once in the terminal:

    ssh -l YOUR_EMAIL -N -R 1:0:localhost:22 sshto.net
    
and answer `yes` to accept the key. Other clients, like <a href="http://www.chiark.greenend.org.uk/~sgtatham/putty/download.html">PuTTY</a> may provide slightly different interface for that.


## On Linux, RPI, Ubuntu, *bsd, unix

Use this one-liner to launch it in background with automatic reconnects:

    while true; do ssh -l YOUR_EMAIL -NR 1:0:localhost:22 -o ServerAliveInterval=60 -o ServerAliveCountMax=2 -o ConnectTimeout=30 -o TCPKeepAlive=yes sshto.net; done &

On ubuntu, just paste this code into console to automatically add it to rc.local:


    sed -i "/exit 0/d" /etc/rc.local # remove exit 0
    cat >> /etc/rc.local &lt;&lt; 'EOF'
    while true; do
    ssh -l YOUR_EMAIL -NR 1:0:localhost:22 -o ServerAliveInterval=60 -o ServerAliveCountMax=2 -o ConnectTimeout=30 -o TCPKeepAlive=yes sshto.net
    done & # fork to background
    exit 0
    EOF


    
## On Mac

In Automator app, create a new application with "Run Shell Script" task with the code as in ubuntu version, save. Then, in System Preferences -> Users & Groups in your "Login Items" add the new automator app and choose "hide". Reboot. See more details <a href="http://stackoverflow.com/questions/22842016/launch-shell-script-on-login-in-mac-os-os-x">here</a>.

## On OpenWRT router / embedded device

You need to be sure to have a decent dropbear version as older versions are not supported yet. You may download one from openwrt website for your platform - in case yours is too old.

Correct dropbear invocation pattern is like:

    while true; do ssh -l YOUR_EMAIL -K 20 -N -R 18:0:localhost:22 sshto.net; done

you can add this to rc.local or create a shell script and run from rc.local in background.

## On Ubuntu Phone

On ubuntu phone I personally use cron job to kill ssh process periodically as it may hang due to network disruptions:

    0 * * * * pkill -f sshto.net
    
## On Windows

SSH on windows is not yet fully supported, see more info <a href="https://blogs.msdn.microsoft.com/powershell/2015/06/03/looking-forward-microsoft-support-for-secure-shell-ssh/">here</a> and <a href="https://blogs.msdn.microsoft.com/powershell/2015/10/19/openssh-for-windows-update/">here</a>. However, you can forward PowerShell remote ports 5985 and 5986 from your Windows CORE IoT, Windows Server or PC using <a href="http://www.chiark.greenend.org.uk/~sgtatham/putty/download.html">PuTTY</a> or easy software listed <a href="http://superuser.com/questions/235395/automatic-ssh-tunneling-from-windows">here</a>

Please send any suggestions to <a href="mailto:info@sshto.net">info@sshto.net</a> or write reports to <a href="https://github.com/sshtonet/sshtonet/issues">https://github.com/sshtonet/sshtonet/issues</a>.
    
[sshtonet]: https://www.sshto.net