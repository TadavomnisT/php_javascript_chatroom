<?php
// //========================================================================
// //========================PHP SERVER SCRIPT===============================
// // ==========SOCKET PROGRAMING============NETWORK PROJECT=================
// //=============BEHRAD BABAEI=================9618053======================
// //=========================GNU LICENCED SCRIPT============================

// setting some variables
ini_set('max_execution_time', 0);//preventingphp default timeout
define('HOST_NAME', "localhost");//running localhost
define('PORT', "15000");//defining port number 15000
$null = NULL;//define NULL in order to put in *** function
$names = [];//client names store here
$resources = [];//active client resources store here

// create socket - this is a TCP protocol socket
$socketResource = socket_create(AF_INET, SOCK_STREAM, SOL_TCP) or die("Could not create socket\n");
// setting some options on the socket
socket_set_option($socketResource, SOL_SOCKET, SO_REUSEADDR, 1) or die("Could not set options\n");
// bind socket to port
socket_bind($socketResource, 0, PORT) or die("Could not bind to the port\n");
// start listening for connections
socket_listen($socketResource) or die("Could not listen for connections\n");
// passing sockets into an array in order to fetch it in while and communicate fo ever
$clientSocketArray = array(
    $socketResource
);
// this endless loop, will handle sockets
while (true)
{
    // getting current clients anew
    $newSocketArray = $clientSocketArray;
    // switching between sockets
    socket_select($newSocketArray, $null, $null, 0, 10);
    if (in_array($socketResource, $newSocketArray))// checking if the socket exist in new sockets lists
    {
        // accept incoming connections
        // client another socket to handle communication
        $newSocket = socket_accept($socketResource);
        $clientSocketArray[] = $newSocket;// adding accepted socket connection to global socket arrray
        $header = socket_read($newSocket, 1024);//reading data from socket
        doHandshake($header, $newSocket, HOST_NAME, PORT);//hand shaking with socket
        socket_getpeername($newSocket, $client_ip_address);//getting client ip address and store it in $client_ip_address 
        $newSocketIndex = array_search($socketResource, $newSocketArray);//search for new sockets's index
        unset($newSocketArray[$newSocketIndex]);//deleting fetched socket
    }
    foreach ($newSocketArray as $newSocketArrayResource)
    {  //Query on every remained socket
        while (@socket_recv($newSocketArrayResource, $socketData, 1024, 0) >= 1)
        { // recieving data ,while current each client is sending it
            $socketMessage = unseal($socketData); //removing headers , and fetching pure data in json
            $decoded_data = json_decode($socketMessage, true); //decoding json into array 
            if (isset($decoded_data["request"]) && $decoded_data["request"] != "")
            {//checking if client sent a valid request
                dump($decoded_data , "Request"); //dump data in order to store logs in file, developers only, comment this if you want
                if ($decoded_data["request"] == "sign_up")
                {//checking if client sent a valid sign_up request
                    if (isset($decoded_data["name"]) && trim($decoded_data["name"]) != "")
                    {//checking if client sent a valid name in request
                        $name = $decoded_data["name"]; //fetching choosed name from request
                        if (!in_array($name, $names)) //checking if name doesn't exist
                        {
                            $names[] = $name;//adding client name to global names
                            $resources[$name] = $newSocketArrayResource;//adding client resource to global resources , indexed name
                            // prepare a response request in orderd to send to new client
                            $response = json_encode(["request" => "message", "message" => ["message" => "Hi $name, welcome to the chat room.", "type" => "server", "from" => $name]]);
                            // prepare a join request in orderd to send to other clients
                            $join = json_encode(["request" => "message", "message" => ["message" => "$name joined the chat room.", "type" => "server", "from" => $name]]);
                            if (isset($response)) send($resources[$name], seal($response)); //send welcome notifnamesication
                            if (isset($join)) send2all(seal($join)); //send join notification to all 
                        }
                        else
                        {// if name exists
                            // prepare a Error request in orderd to send to new client
                            $response = json_encode(["request" => "error", "error" => "Username already taken! Pick Somthing else."]);
                            if (isset($response)) send($newSocketArrayResource, seal($response));//send Error request
                        }
                    }
                    else
                    {// if username was empty
                        // prepare a Error request in orderd to send to new client
                        $response = json_encode(["request" => "error", "error" => "Username cannot be empty!"]);
                        if (isset($response)) send($newSocketArrayResource, seal($response));//send Error request
                    }
                }
                elseif ($decoded_data["request"] == "public_message")
                {//checking if request was a public message
                    if (trim($decoded_data["message"]["message"]) != "")
                    {//fetching public message from request
                        // prepare a response request in orderd to send to every clients
                        $response = json_encode(["request" => "message", "message" => ["message" => trim($decoded_data["message"]["message"]) , "type" => "public", "from" => getName($newSocketArrayResource) ]]);
                        if (isset($response)) send2all(seal($response)); //send message to all
                    }
                    else
                    {// if message was empty
                        // prepare a Error request in orderd to send to new client
                        $response = json_encode(["request" => "error", "error" => "Message text was empty."]);
                        if (isset($response)) send($resources[getName($newSocketArrayResource) ], seal($response));//send Error request
                    }
                }
                elseif ($decoded_data["request"] == "private_message")
                {//checking if request was a private message
                    if (trim($decoded_data["message"]["message"]) != "")
                    {//fetching private message from request
                        // prepare a response request in orderd to send to wanted clients
                        $response = json_encode(["request" => "message", "message" => ["message" => trim($decoded_data["message"]["message"]) , "type" => "private", "from" => getName($newSocketArrayResource) ]]);
                        if (isset($response)) foreach ($names as $name)//send private message to every spesific reciever
                        {
                            if (in_array($name, $decoded_data["message"]["to"]))
                            {
                                send($resources[$name], seal($response));
                            }
                        }// prepare a response request in orderd to send to client
                        $response = json_encode(["request" => "message", "message" => ["message" => trim($decoded_data["message"]["message"]) , "type" => "private_response", "from" => getName($newSocketArrayResource) , "to" => $decoded_data["message"]["to"]]]);
                        if (isset($response)) send($resources[getName($newSocketArrayResource) ], seal($response));//send response request
                    }
                    else
                    {// if message was empty
                        // prepare a Error request in orderd to send to new client
                        $response = json_encode(["request" => "error", "error" => "Message text was empty."]);
                        if (isset($response)) send($resources[getName($newSocketArrayResource) ], seal($response));//send Error request
                    }
                }
                elseif ($decoded_data["request"] == "participants")
                {//checking if request was a get paticipants
                    // prepare a response request in orderd to send to client
                    $response = json_encode(["request" => "participants", "participants" => array_values($names) ]);
                    if (isset($response)) send($resources[getName($newSocketArrayResource) ], seal($response));//send response request
                }
                elseif ($decoded_data["request"] == "leave")
                {//checking if request was a leave chatroom
                    // prepare a response request in orderd to send to every clients
                    $leave = json_encode(["request" => "message", "message" => ["message" => getName($newSocketArrayResource) . " left the chat room.", "type" => "server", "from" => getName($newSocketArrayResource) ]]);
                    if (isset($leave)) send2all(seal($leave)); //send leave notification to all
                    // unset($resources[getName($newSocketArrayResource)]);//delete client's resource
                    $newNameIndex = array_search(getName($newSocketArrayResource) , $names);
                    unset($names[$newNameIndex]);//delete client's name
                    $newSocketIndex = array_search($newSocketArrayResource, $clientSocketArray);
                    unset($clientSocketArray[$newSocketIndex]);//delete client's socket
                }
            }
            break 2; //break from while , not the foreach
        }
        $socketData = @socket_read($newSocketArrayResource, 1024, PHP_NORMAL_READ);
        if ($socketData === false)
        {//testing if any of clients left the chatroom suddenly
            // prepare a response request in orderd to send to every clients
            $leave = json_encode(["request" => "message", "message" => ["message" => getName($newSocketArrayResource) . " left the chat room.", "type" => "server", "from" => getName($newSocketArrayResource) ]]);
            if (isset($leave)) send2all(seal($leave)); //send leave notification to all
            // unset($resources[getName($newSocketArrayResource)]);//delete client's resource
            $newNameIndex = array_search(getName($newSocketArrayResource) , $names);
            unset($names[$newNameIndex]);//delete client's name
            $newSocketIndex = array_search($newSocketArrayResource, $clientSocketArray);
            unset($clientSocketArray[$newSocketIndex]);//delete client's socket
        }
    }
}
//close socket, if every thing works fine, script never reaches here
socket_close($socketResource);
// ======================================================Functions======================================================
function getName($currentResource)
{//returns name of a resource
    global $resources;
    foreach ($resources as $key => $value) if ($value == $currentResource) return $key;
    return false;
}
// ---------------------------------------------------------------------------------
function send2all($message)
{//sends every clients a message
    global $resources;
    $messageLength = strlen($message);
    foreach ($resources as $clientSocket)
    {
        @socket_write($clientSocket, $message, $messageLength);
    }
    return true;
}
// ---------------------------------------------------------------------------------
function send($clientSocket, $message)
{//sends a client a message
    $messageLength = strlen($message);
    @socket_write($clientSocket, $message, $messageLength);
    return true;
}
// ---------------------------------------------------------------------------------
function unseal($socketData)
{//an opensource GNU licenced function to  Unmask pure data from websocket,
    $length = ord($socketData[1]) & 127;
    if ($length == 126)
    {
        $masks = substr($socketData, 4, 4);
        $data = substr($socketData, 8);
    }
    elseif ($length == 127)
    {
        $masks = substr($socketData, 10, 4);
        $data = substr($socketData, 14);
    }
    else
    {
        $masks = substr($socketData, 2, 4);
        $data = substr($socketData, 6);
    }
    $socketData = "";
    for ($i = 0;$i < strlen($data);++$i)
    {
        $socketData .= $data[$i] ^ $masks[$i % 4];
    }
    return $socketData;
}
// ---------------------------------------------------------------------------------
function seal($socketData)
{//an opensource GNU licenced function to  Mask headers into data for websocket,
    $b1 = 0x80 | (0x1 & 0x0f);
    $length = strlen($socketData);

    if ($length <= 125) $header = pack('CC', $b1, $length);
    elseif ($length > 125 && $length < 65536) $header = pack('CCn', $b1, 126, $length);
    elseif ($length >= 65536) $header = pack('CCNN', $b1, 127, $length);
    return $header . $socketData;
}

function doHandshake($received_header, $client_socket_resource, $host_name, $port)
{//an opensource GNU licenced function to send an recieve headers in order to handshaking in websocket,
    try {
		$headers = array();
		$lines = preg_split("/\r\n/", $received_header);
		foreach ($lines as $line)
		{
			$line = chop($line);
			if (preg_match('/\A(\S+): (.*)\z/', $line, $matches))
			{
				$headers[$matches[1]] = $matches[2];
			}
		}
		$secKey = $headers['Sec-WebSocket-Key'];
		$secAccept = base64_encode(pack('H*', sha1($secKey . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')));
		$buffer = "HTTP/1.1 101 Web Socket Protocol Handshake\r\n" . "Upgrade: websocket\r\n" . "Connection: Upgrade\r\n" . "WebSocket-Origin: $host_name\r\n" . "WebSocket-Location: ws://$host_name:$port/demo/shout.php\r\n" . "Sec-WebSocket-Accept:$secAccept\r\n\r\n";
		socket_write($client_socket_resource, $buffer, strlen($buffer));
	} catch (\Throwable $th) {}
}
// ---------------------------------------------------------------------------------
function dump($dumpedVar, $dumpInfo = "dumped Variable")
{//dumps a variable/object in logs.txt in order to save logs 
    ob_start();
    echo " $dumpInfo : ";
    var_dump($dumpedVar);
    echo PHP_EOL;
    $rtempy = ob_get_clean();
    $file = fopen("logs.txt", "a+") or die;
    fwrite($file, $rtempy);
    fclose($file);
}

// ====================================================End of Functions=======================================================

// //========================================================================
// //========================PHP SERVER SCRIPT===============================
// // ==========SOCKET PROGRAMING============NETWORK PROJECT=================
// //=============BEHRAD BABAEI=================9618053======================
// //=========================GNU LICENCED SCRIPT============================

?>