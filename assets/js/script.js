if (typeof NodeList.prototype.forEach !== 'function') {//Taking care of forEach object Problem in FireFox,Internet Explorer,WaterFox
    NodeList.prototype.forEach = Array.prototype.forEach;
}

function showMessage(messageHTML) { //a function for appending a div object which contains messages into chatbox
    $('#chat_box').append(messageHTML);
}
$(document).ready(function () { //starting connecting socket and stay connected for ever
    var socket = new WebSocket("ws://localhost:15000/server.php");
    socket.onopen = function (event) { //if connected ro a websocket on event will show sign up
        document.getElementById("server_status").setAttribute("class", "ok");
        document.getElementById("server_status").innerHTML = "Server is online! Enter a unique name to join the chat!";
    }
    socket.onmessage = function (event) { //whenever a message (data) is recieved, it'll fetch it and do something about the recieved message
        console.log(event.data); //logging every recieved data in console , for developers only, you may comment this line
        var Data = JSON.parse(event.data); //parsing (Json decoding) message
        var element = document.getElementById('sign_up');
        if (typeof (element) != 'undefined' && element != null) { // this condition is true, if the user didin't sign up yet
            if (Data.request == "error") {//if signing up wasn't succesful...showing Errors
                document.getElementById("master_errors").innerHTML = Data.error;
            } else {//if signing up was succesful:
                if (Data.request == "message") {
                    try {//displaying chat box and buttons instead of signing up form
                        document.getElementById("master_errors").innerHTML = "";
                        document.getElementById("server_status").innerHTML = "";
                        document.getElementById("sign_up").setAttribute("name", "frmChat");
                        document.getElementById("sign_up").setAttribute("id", "frmChat");
                        document.getElementById("nothing").setAttribute("id", "chat_box");
                        document.getElementById("btnSend").setAttribute("name", "send_chat_message");
                        document.getElementById("btnSend").setAttribute("value", "Send");
                        document.getElementById("chat_message").hidden = false;
                        document.getElementById("getParticipants").style.visibility = "visible";
                        document.getElementById("leaveChat").style.visibility = "visible";
                        document.getElementById("chat_message").required = true;
                        document.getElementById("chat_message").value = "";
                        document.getElementById("chat_user").hidden = true;
                    } catch (e) { }
                    //seting type of message
                    if (Data.message.type == "server") {
                        var type = "server_";
                    } else {
                        if (Data.message.from == document.getElementById("chat_user").value) {
                            var type = "self_";
                        } else var type = "ordinary_";
                    }
                    showMessage("<div class='" + type + "message'>" + Data.message.message + "</div>"); //Showing messages one from server and one from self
                } else {
                    document.getElementById("master_errors").innerHTML = "Unknown Error!";
                }
            }
        } else {// this else will execute when user successfully signed up
            if (Data.request == "message") { //handling message if the data request was a message
                if (Data.message.type == "server") {//setting type of displaying message if it was from server
                    showMessage("<div class='server_input'>" + Data.message.message + "</div>");
                } else {//setting type of displaying message if it was a public\private\private_response message
                    if (Data.message.from == document.getElementById("chat_user").value) {// if the message was from user himself
                        if (Data.message.type == "public") {//showing public typed self message 
                            showMessage("<div width='100%' align='right'><div class='self_chat_input'>" + Data.message.message + "</div></div><br style='clear:both' />");
                        }//by uncommenting following part you will be able to display a private messaged from user to user himself!
                        //// **************************************************************************
                        //     else if (Data.message.type == "private") {
                        //         var private_info = "<span style='color:red'>&lt;Private Message&gt;</span><br>";
                        //         showMessage("<div style='overflow:hidden;border-radius: 15px 50px 30px 5px;width=500px;' class='chat_box_message'>"+Data.message.from+":<br> <div class='chat_input'>"+private_info+Data.message.message+"</div></div><br style='clear:both' />");
                        // }
                        //// **************************************************************************
                        else if (Data.message.type == "private_response") {//showing private_response typed message : This will recieve if sending a private message was succesfull 
                            var private_info = "<span style='color:blue'>&lt;Private Message&gt; to ";
                            for (let index = 0; index < (Data.message.to).length; index++) {//showing guys that recieved your private message
                                private_info += Data.message.to[index] + ",";
                            }
                            private_info += ":</span><br>";
                            showMessage("<div width='100%' align='right'><div class='self_chat_input'>" + private_info + Data.message.message + "</div></div><br style='clear:both' />");
                        }
                    } else {
                        if (Data.message.type == "public") { // showing public typed messages recieved from others
                            showMessage("<div style='overflow:hidden;border-radius: 15px 50px 30px 5px;width=500px;' class='chat_box_message'>" + Data.message.from + ":<br> <div class='chat_input'>" + Data.message.message + "</div></div><br style='clear:both' />");
                        } else if (Data.message.type == "private") {// showing private typed messages recieved from others
                            var private_info = "<span style='color:red'>&lt;Private Message&gt;</span><br>";
                            showMessage("<div style='overflow:hidden;border-radius: 15px 50px 30px 5px;width=500px;' class='chat_box_message'>" + Data.message.from + ":<br> <div class='chat_input'>" + private_info + Data.message.message + "</div></div><br style='clear:both' />");
                        }
                    }
                }
            } else if (Data.request == "participants") {// showing response recieved from server in order to get chat participants (attendees)
                var delNode = document.getElementById("users");
                while (delNode.firstChild) {
                    delNode.removeChild(delNode.lastChild);
                }
                Data.participants.forEach(myForEach);//show each guy in chat as a choice to send message

                function myForEach(user) {
                    $('#users').append("<input type='checkbox' id=" + user + " name=" + user + " value=" + user + "><label for=" + user + ">" + user + "</label><br>");
                }
                $('#users').append("<input type='text' name='private_message' id='private_message' placeholder='private message' class='chat_input' style='width: 100%;' required />");

                $('#users').append("<input type='submit' id='sendPrivateMessage' name='sendPrivateMessage' value='send private message!' >");
                document.getElementById("getParticipants").value = "refresh users";
            } else { //if other things recieve from server, consider those error!
                document.getElementById("master_errors").innerHTML = "Unknown Error!";
            }
            $('#chat_message').val(''); //cleaning textbox
        }
    };
    socket.onerror = function (event) { //if there was an error related to socket
        showMessage("<div class='error'>Problem due to some Error</div>");
    };
    socket.onclose = function (event) { //if socked was closed by server
        showMessage("<div class='chat-connection-ack'>Connection Closed</div>");
    };
    $('#sign_up').on("submit", function (event) {//sending a sign_up\message request to server if user pressed button
        event.preventDefault(); //prevents page reloading
        var testelement = document.getElementById('sign_up');
        if (typeof (testelement) != 'undefined' && testelement != null) {//checking if user hav'nt already signed up
            var messageJSON = { //providing requset
                request: "sign_up",
                name: $('#chat_user').val(),
            };
            socket.send(JSON.stringify(messageJSON));//sedning Json encoded request 
        } else { //this else is true when user is already signed up and wants to send message
            var messageJSON = {//providing requset message
                request: "public_message",
                message: {
                    message: $('#chat_message').val(),
                    from: $('#chat_user').val()
                }
            };
            socket.send(JSON.stringify(messageJSON));//sedning Json encoded request 
            document.getElementById("chat_message").value = "";//cleaning textbox
        }

    });
    $('#paricipants').on("submit", function (event) { //sending a get_participants request to server if user pressed button
        event.preventDefault();//prevents page reloading
        var testelement = document.getElementById('getParticipants').style.visibility;
        if (testelement != "hidden") {//checking if the button isn't hidden
            var messageJSON = {//providing requset message
                request: "participants",
                from: $('#chat_user').val()
            };
            socket.send(JSON.stringify(messageJSON));//sedning Json encoded request 
        }
    });
    $('#leave').on("submit", function (event) {//sending a leave_chat request to server if user pressed button
        event.preventDefault();//prevents page reloading
        var testelement = document.getElementById('leaveChat').style.visibility;
        if (testelement != "hidden") {//checking if the button isn't hidden

            var messageJSON = {//providing requset message
                request: "leave",
                from: $('#chat_user').val()
            };
            socket.send(JSON.stringify(messageJSON));//sedning Json encoded request 
            window.location.reload(false);//reloading the page
        }
    });
    $('#users').on("submit", function (event) {//sending a private_message request to server if user pressed button
        event.preventDefault();//prevents page reloading
        var testelement = document.getElementById('sendPrivateMessage');
        if (typeof (testelement) != 'undefined' && testelement != null) {//checking if the the request is valid, meaning user already sent for participants and now choosed some

            var checks = document.getElementById("users").childNodes;
            var checked_array = [];
            checks.forEach(checksForEach);//fetching choosed users in order to send private message

            function checksForEach(node) {
                var tmp = document.getElementById(node.id);
                if (typeof tmp !== 'undefined' && tmp !== null)
                    if (tmp.checked == true) checked_array.push(document.getElementById(node.id).name);
            }
            if (checked_array.length > 0) {// this condition is true if user have choosed at least one guy to send private message
                var messageJSON = {//providing requset message
                    request: "private_message",
                    message: {
                        message: $('#private_message').val(),
                        from: $('#chat_user').val(),
                        to: checked_array
                    }
                };
                socket.send(JSON.stringify(messageJSON));//sedning Json encoded request 
            } else alert("You didn't choose any user!"); //alerting error if user didn't chose anyone but pressed the button
        }
    });
});