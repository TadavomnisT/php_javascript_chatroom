# Chatroom using PHP and JavaScript
### (PHP Socket Programming)

Hey there!

I've created a simple server confuguration in PHP in order to handle a simple chatroom with several clients from web or any other GUI that can impement `websocket`.
I used the socket architecture and started server on port number ```15000``` .
This project can be used in purpose of learning socket programming.
I used json ecoding for APIs and WebSocket protocol in JavaScript and PHP.

## Usage
* Simply just install it using :
```
git clone https://github.com/TadavomnisT/php_javascript_chatroom.git
```
Then run `server.php`:

```
cd php_javascript_chatroom
php server.php
```

Now open `client.html` in browser and start chatting :)


## IMPORTANT

```diff
- YOU MUST ENABLE `socket` EXTENTION IN YOUR PHP PACKAGE.
```

If you recieved following error:
```
couldn't load socket extention.
```
it means you haven't load `socket` extetion properly, so then if you have installed it already just uncomment the line:
`;extension=php_sockets.dll ` to `extension=php_sockets.dll `
in your `php.ini` file. If you haven't install it, in windows you should download `.dll` file and put in in dll directory.
________________________________________________

## Gallery:

#### preview:


https://user-images.githubusercontent.com/63199745/209545510-12f7c1c3-23bd-43d5-9c8b-bc5887322fe0.mp4


## Development Info
* Homepage: https://github.com/TadavomnisT/php_javascript_chatroom/
* Repo: https://github.com/TadavomnisT/php_javascript_chatroom/

## Main Author
* Behrad.B
* Contact: http://TadavomnisT.iR

[contributors]: https://github.com/TadavomnisT/php_javascript_chatroom/graphs/contributors

##  [Contributors][contributors]

* TadavomnisT
* MSFPT

## License
*  GPL-3.0 license 

Have fun!
