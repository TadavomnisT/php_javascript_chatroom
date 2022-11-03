// taking care of forEach object problem in FireFox, Internet Explorer, WaterFox
if (typeof NodeList.prototype.forEach !== 'function') NodeList.prototype.forEach = Array.prototype.forEach;

const selector = (selectors = "") => {

    try { var select = document.querySelectorAll(selectors); } catch (error) { }

    return ((!select) ? false : ((select.length == 0) ? false : ((select.length == 1) ? select[0] : select)));

}

/**
 * @param {String} HTML representing any number of sibling elements
 * @return {NodeList} 
 */
const createElementFromHTML = (htmlString = "") => {

    var template = document.createElement('template');

    template.innerHTML = htmlString;

    return template.content;

}

// a function for appending a div object which contains messages into chatbox
const showMessage = (messageHTML = "") => selector("#chat_box").append(createElementFromHTML(messageHTML));

document.addEventListener("DOMContentLoaded", event => {

    //starting connecting socket and stay connected for ever
    var socket = new WebSocket("ws://localhost:15000/server.php");

    // if connected ro a websocket on event will show sign up
    socket.onopen = event => {

        selector("#server_status").classList.add("ok");

        selector("#server_status").innerHTML = "Server is online! Enter a unique name to join the chat!";

    }

    // whenever a message (data) is recieved, it'll fetch it and do something about the recieved message
    socket.onmessage = event => {

        // logging every recieved data in console , for developers only, you may comment this line
        console.log(event.data);

        // parsing (Json decoding) message
        var Data = JSON.parse(event.data);

        var element = document.getElementById("sign_up");

        // this condition is true, if the user didin't sign up yet
        if (typeof (element) != 'undefined' && element != null) {
            

            // if signing up wasn't succesful...showing Errors
            if (Data.request == "error") selector("#master_errors").innerHTML = Data.error;
            
            // if signing up was succesful:
            else {
                
                if (Data.request == "message") {

                    // displaying chat box and buttons instead of signing up form
                    try {
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
                    var type = (Data.message.type == "server") ? "server_" : (Data.message.from == tools.selector("#chat_user").value) ? "self_" : "ordinary_";

                    // Showing messages one from server and one from self
                    showMessage("<div class='" + type + "message'>" + Data.message.message + "</div>");
                    
                } else selector("#master_errors").innerHTML = "Unknown Error!";

            }
            
        }
        
        // this else will execute when user successfully signed up
        else {
            
            // handling message if the data request was a message
            if (Data.request == "message") {

                // setting type of displaying message if it was from server
                if (Data.message.type == "server") showMessage("<div class='server_input'>" + Data.message.message + "</div>");

                // setting type of displaying message if it was a public\private\private_response message
                else {

                    // if the message was from user himself
                    if (Data.message.from == selector("#chat_user").value) {
                        

                        // showing public typed self message 
                        if (Data.message.type == "public") showMessage("<div width='100%' align='right'><div class='self_chat_input'>" + Data.message.message + "</div></div><br style='clear:both' />");

                        // by uncommenting following part you will be able to display a private messaged from user to user himself!
                        //// **************************************************************************
                        //     else if (Data.message.type == "private") {
                        //         var private_info = "<span style='color:red'>&lt;Private Message&gt;</span><br>";
                        //         showMessage("<div style='overflow:hidden;border-radius: 15px 50px 30px 5px;width=500px;' class='chat_box_message'>"+Data.message.from+":<br> <div class='chat_input'>"+private_info+Data.message.message+"</div></div><br style='clear:both' />");
                        // }
                        //// **************************************************************************

                        // showing private_response typed message : This will recieve if sending a private message was succesfull
                        else if (Data.message.type == "private_response") {

                            var private_info = "<span style='color:blue'>&lt;Private Message&gt; to ";

                            // showing guys that recieved your private message
                            for (let index = 0; index < (Data.message.to).length; index++) {
                                private_info += Data.message.to[index] + ",";
                            }

                            private_info += ":</span><br>";

                            showMessage("<div width='100%' align='right'><div class='self_chat_input'>" + private_info + Data.message.message + "</div></div><br style='clear:both' />");

                        }

                    } else {

                        // showing public typed messages recieved from others
                        if (Data.message.type == "public") showMessage("<div style='overflow:hidden;border-radius: 15px 50px 30px 5px;width=500px;' class='chat_box_message'>" + Data.message.from + ":<br> <div class='chat_input'>" + Data.message.message + "</div></div><br style='clear:both' />");

                        // showing private typed messages recieved from others
                        else if (Data.message.type == "private") {

                            var private_info = "<span style='color:red'>&lt;Private Message&gt;</span><br>";

                            showMessage("<div style='overflow:hidden;border-radius: 15px 50px 30px 5px;width=500px;' class='chat_box_message'>" + Data.message.from + ":<br> <div class='chat_input'>" + private_info + Data.message.message + "</div></div><br style='clear:both' />");

                        }

                    }

                }

            }

            // showing response recieved from server in order to get chat participants (attendees)
            else if (Data.request == "participants") {

                var delNode = document.getElementById("users");
                
                while (delNode.firstChild) delNode.removeChild(delNode.lastChild);

                // show each guy in chat as a choice to send message
                Data.participants.forEach(user => selector("#users").append(createElementFromHTML("<input type='checkbox' id=" + user + " name=" + user + " value=" + user + "><label for=" + user + ">" + user + "</label><br>")));

                selector("#users").append(createElementFromHTML("<input type='text' name='private_message' id='private_message' placeholder='private message' class='chat_input' style='width: 100%;' required />"));

                selector("#users").append(createElementFromHTML("<input type='submit' id='sendPrivateMessage' name='sendPrivateMessage' value='send private message!' />"));
                
                selector("#getParticipants").value = "refresh users";
            
            }

            // if other things recieve from server, consider those error!
            else selector("#master_errors").innerHTML = "Unknown Error!";

            // cleaning textbox
            selector("#chat_message").value = "";

        }

    }

    // if there was an error related to socket
    socket.onerror = event => showMessage("<div class='error'>Problem due to some Error</div>");

    // if socked was closed by server
    socket.onclose = event => showMessage("<div class='chat-connection-ack'>Connection Closed</div>");

    // sending a sign_up\message request to server if user pressed button
    selector("#sign_up").addEventListener("submit", event => {

        // prevents page reloading
        event.preventDefault();

        var testelement = document.getElementById("sign_up");

        // checking if user hav'nt already signed up
        if (typeof (testelement) != 'undefined' && testelement != null) {

            // providing requset
            var messageJSON = {
                request: "sign_up",
                name: selector("#chat_user").value,
            };

            // // sedning Json encoded request
            socket.send(JSON.stringify(messageJSON));

        }
        
        // this else is true when user is already signed up and wants to send message
        else {

            // providing requset message
            var messageJSON = {
                request: "public_message",
                message: {
                    message: selector("#chat_message").value,
                    from: selector("#chat_user").value
                }
            };

            // sedning Json encoded request
            socket.send(JSON.stringify(messageJSON));

            // cleaning textbox
            selector("#chat_message").value = "";

        }

    });

    // sending a get_participants request to server if user pressed button
    selector("#paricipants").addEventListener("submit", event => {

        // prevents page reloading
        event.preventDefault();

        var testelement = selector("#getParticipants").style.visibility;

        // checking if the button isn't hidden
        if (testelement != "hidden") {

            // providing requset message
            var messageJSON = {
                request: "participants",
                from: selector("#chat_user").value
            };

            // sedning Json encoded request 
            socket.send(JSON.stringify(messageJSON));

        }

    });

    // sending a leave_chat request to server if user pressed button
    selector("#leave").addEventListener("submit", event => {

        // prevents page reloading
        event.preventDefault();

        var testelement = selector("#leaveChat").style.visibility;

        // checking if the button isn't hidden
        if (testelement != "hidden") {

            // providing requset message
            var messageJSON = {
                request: "leave",
                from: selector("#chat_user").value
            };

            // sedning Json encoded request 
            socket.send(JSON.stringify(messageJSON));

            // reloading the page
            window.location.reload(false);

        }

    });

    // sending a private_message request to server if user pressed button
    selector("#users").addEventListener("submit", event => {

        // prevents page reloading
        event.preventDefault();

        var testelement = selector("#sendPrivateMessage");

        // checking if the the request is valid, meaning user already sent for participants and now choosed some
        if (typeof (testelement) != 'undefined' && testelement != null) {

            var checks = selector("#users").childNodes;

            var checked_array = [];

            // fetching choosed users in order to send private message
            checks.forEach(node => {

                var tmp = document.getElementById(node.id);

                if (tmp) if (tmp.checked == true) checked_array.push(tmp.name);

            });

            // this condition is true if user have choosed at least one guy to send private message
            if (checked_array.length > 0) {

                // providing requset message
                var messageJSON = {
                    request: "private_message",
                    message: {
                        message: selector("#private_message").value,
                        from: selector("#chat_user").value,
                        to: checked_array
                    }
                };

                // sedning Json encoded request 
                socket.send(JSON.stringify(messageJSON));

            }

            // alerting error if user didn't chose anyone but pressed the button
            else alert("You didn't choose any user!");

        }

    });

});