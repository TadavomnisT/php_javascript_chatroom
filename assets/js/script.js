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

const createText = (messageHTML = "") => messageHTML.replace('<', '«').replace('>', '»');

// a function for appending a div object which contains messages into chatbox
const showMessage = (messageHTML = "") => selector("#chat_box").append(createElementFromHTML(messageHTML));

window.addEventListener("DOMContentLoaded", event => {

    const loading = selector("#loading");

    var fadeOutInterval;

    const fadeOut = (element, timing = 7) => {

        clearInterval(fadeOutInterval);

        element.fadeOut = timing => {

            var newValue = 1;

            element.style.opacity = 1;

            fadeOutInterval = setInterval(() => {

                if (newValue > 0) newValue -= 0.01;
                else if (newValue < 0) {

                    element.style.opacity = 0;

                    element.style.display = "none";

                    clearInterval(fadeOutInterval);

                }

                element.style.opacity = newValue;

            }, timing);

        }

        element.fadeOut(timing);

    }

    setTimeout(() => fadeOut(loading, 4), 300);

    setTimeout(() => loading.remove(), 700);

});

document.addEventListener("DOMContentLoaded", event => {

    selector("#reload_page").onclick = event => [event.preventDefault(), location.reload()];

    //starting connecting socket and stay connected for ever
    var socket = new WebSocket("ws://localhost:15000/server.php");

    // if connected ro a websocket on event will show sign up
    socket.onopen = event => {

        selector("#server_error").classList.add("hide");

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
                        document.getElementById("chat_message").required = true;
                        document.getElementById("chat_message").value = "";
                        document.getElementById("chat_user").hidden = true;
                        ["users_box", "show_users", "leave"].forEach(element => selector(`#${element}`).classList.remove("hide"));
                    } catch (e) { }

                    // sending a refresh_users request to server if user pressed button
                    selector("#refresh_users").addEventListener("click", event => {

                        // prevents page reloading
                        event.preventDefault();
                        // providing requset message
                        var messageJSON = {
                            request: "participants",
                            from: selector("#chat_user").value
                        };

                        // sedning Json encoded request 
                        socket.send(JSON.stringify(messageJSON));

                    });

                    selector("#refresh_users").click();

                    // setInterval(() => {
                        
                    //     if (
                    //         (selector("#private_message").value.trim() == '') &&
                    //         (selector("#chat_message").value.trim() == '')
                    //     ) selector("#refresh_users").click();

                    // }, 1000); // 1s

                    selector("#show_users").addEventListener("click", event => [selector("#refresh_users").click(), selector("#users_box").classList.toggle("active")]);

                    //seting type of message
                    var type = (Data.message.type == "server") ? "server_" : (Data.message.from == tools.selector("#chat_user").value) ? "self_" : "ordinary_";

                    // Showing messages one from server and one from self
                    showMessage("<div class='" + type + "message'>" + createText(Data.message.message) + "</div>");
                    
                } else selector("#master_errors").innerHTML = "Unknown Error!";

            }
            
        }
        
        // this else will execute when user successfully signed up
        else {
            
            // handling message if the data request was a message
            if (Data.request == "message") {

                // setting type of displaying message if it was from server
                if (Data.message.type == "server") showMessage("<p class='server_message_i'>" + createText(Data.message.message) + "</p>");

                // setting type of displaying message if it was a public\private\private_response message
                else {

                    // if the message was from user himself
                    if (Data.message.from == selector("#chat_user").value) {
                        
                        var svg_msg_box = `<svg width="9px" height="20px" viewbox="0 0 9 20" class="svg_msg_box flip"><svg class="bubble_icon" width="9px" height="20px" viewBox="0 0 9 20"><g fill="none"><path class="svg_fill_msg_box" fill="#ffffff" d="M8,1 L9,1 L9,20 L8,20 L8,18 C7.807,15.161 7.124,12.233 5.950,9.218 C5.046,6.893 3.504,4.733 1.325,2.738 L1.325,2.738 C0.917,2.365 0.89,1.732 1.263,1.325 C1.452,1.118 1.72,1 2,1 L8,1 Z"></path></g></svg></svg>`;

                        // showing public typed self message 
                        if (Data.message.type == "public") showMessage("<div align='right' dir='auto'><div class='self_chat_input'>" + createText(Data.message.message) + svg_msg_box + "</div></div>");

                        // showing private_response typed message : This will recieve if sending a private message was succesfull
                        else if (Data.message.type == "private_response") {

                            var private_info = "<span class='wt'>&lt;Private Message&gt; to ";

                            // showing guys that recieved your private message

                            var tmp_name = [];

                            (Data.message.to).forEach(data => tmp_name.push(createText(data)));

                            private_info += tmp_name.join(", ");

                            private_info += ":</span><br>";

                            var svg_msg_box = `<svg width="9px" height="20px" viewbox="0 0 9 20" class="svg_msg_box flip"><svg class="bubble_icon" width="9px" height="20px" viewBox="0 0 9 20"><g fill="none"><path class="svg_fill_msg_box" fill="#ffffff" d="M8,1 L9,1 L9,20 L8,20 L8,18 C7.807,15.161 7.124,12.233 5.950,9.218 C5.046,6.893 3.504,4.733 1.325,2.738 L1.325,2.738 C0.917,2.365 0.89,1.732 1.263,1.325 C1.452,1.118 1.72,1 2,1 L8,1 Z"></path></g></svg></svg>`;

                            showMessage("<div align='right' dir='auto'><div class='self_chat_input'>" + private_info + createText(Data.message.message) + svg_msg_box + "</div></div>");

                        }

                    } else {

                        var svg_msg_box = `<svg width="9px" height="20px" viewbox="0 0 9 20" class="svg_msg_box flip-y"><svg class="bubble_icon" width="9px" height="20px" viewBox="0 0 9 20"><g fill="none"><path class="svg_fill_msg_box" fill="#ffffff" d="M8,1 L9,1 L9,20 L8,20 L8,18 C7.807,15.161 7.124,12.233 5.950,9.218 C5.046,6.893 3.504,4.733 1.325,2.738 L1.325,2.738 C0.917,2.365 0.89,1.732 1.263,1.325 C1.452,1.118 1.72,1 2,1 L8,1 Z"></path></g></svg></svg>`;

                        // showing public typed messages recieved from others
                        if (Data.message.type == "public") showMessage("<div class='chat_box_message' dir='auto'>" + createText(Data.message.from) + ":<br> <div class='chat_input'>" + createText(Data.message.message) + "</div>" + svg_msg_box + "</div>");

                        // showing private typed messages recieved from others
                        else if (Data.message.type == "private") {

                            var private_info = "<span> &lt;Private Message&gt; </span>";

                            showMessage("<div class='chat_box_message' dir='auto'>" + createText(Data.message.from) + private_info + ":<br> <div class='chat_input'>" + createText(Data.message.message) + "</div>" + svg_msg_box + "</div>");

                        }

                    }

                }

            }

            // showing response recieved from server in order to get chat participants (attendees)
            else if (Data.request == "participants") {

                var delNode = document.getElementById("user_names");
                
                while (delNode.firstChild) delNode.removeChild(delNode.lastChild);

                // show each guy in chat as a choice to send message
                Data.participants.forEach(user => {

                    var checkbox = document.createElement("input");

                    checkbox.type = "checkbox";

                    checkbox.classList.add("hide");

                    var checkbox_label = document.createElement("label");

                    checkbox_label.setAttribute("for", user);

                    var checkbox_label_span = document.createElement("span");

                    checkbox_label_span.innerText = checkbox.value = checkbox.name = checkbox.id = user;

                    var checkbox_label_img_1 = new Image(25);

                    checkbox_label_img_1.setAttribute("dark", "true")

                    checkbox_label_img_1.src = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjRweCIgaGVpZ2h0PSIyNHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8dGl0bGU+aWNfZmx1ZW50X2NoZWNrYm94X3VuY2hlY2tlZF8yNF9yZWd1bGFyPC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGcgaWQ9IvCflI0tUHJvZHVjdC1JY29ucyIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9ImljX2ZsdWVudF9jaGVja2JveF91bmNoZWNrZWRfMjRfcmVndWxhciIgZmlsbD0iIzIxMjEyMSIgZmlsbC1ydWxlPSJub256ZXJvIj4KICAgICAgICAgICAgPHBhdGggZD0iTTUuNzUsMyBMMTguMjUsMyBDMTkuNzY4NzgzMSwzIDIxLDQuMjMxMjE2OTQgMjEsNS43NSBMMjEsMTguMjUgQzIxLDE5Ljc2ODc4MzEgMTkuNzY4NzgzMSwyMSAxOC4yNSwyMSBMNS43NSwyMSBDNC4yMzEyMTY5NCwyMSAzLDE5Ljc2ODc4MzEgMywxOC4yNSBMMyw1Ljc1IEMzLDQuMjMxMjE2OTQgNC4yMzEyMTY5NCwzIDUuNzUsMyBaIE01Ljc1LDQuNSBDNS4wNTk2NDQwNiw0LjUgNC41LDUuMDU5NjQ0MDYgNC41LDUuNzUgTDQuNSwxOC4yNSBDNC41LDE4Ljk0MDM1NTkgNS4wNTk2NDQwNiwxOS41IDUuNzUsMTkuNSBMMTguMjUsMTkuNSBDMTguOTQwMzU1OSwxOS41IDE5LjUsMTguOTQwMzU1OSAxOS41LDE4LjI1IEwxOS41LDUuNzUgQzE5LjUsNS4wNTk2NDQwNiAxOC45NDAzNTU5LDQuNSAxOC4yNSw0LjUgTDUuNzUsNC41IFoiIGlkPSLwn46oQ29sb3IiPjwvcGF0aD4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==";

                    var checkbox_label_img_2 = new Image(25);

                    checkbox_label_img_2.src = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjRweCIgaGVpZ2h0PSIyNHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8dGl0bGU+aWNfZmx1ZW50X2NoZWNrYm94X2NoZWNrZWRfMjRfZmlsbGVkPC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGcgaWQ9IvCflI0tUHJvZHVjdC1JY29ucyIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9ImljX2ZsdWVudF9jaGVja2JveF9jaGVja2VkXzI0X2ZpbGxlZCIgZmlsbD0iIzI2YWYyNiIgZmlsbC1ydWxlPSJub256ZXJvIj4KICAgICAgICAgICAgPHBhdGggZD0iTTE4LDMgQzE5LjY1Njg1NDIsMyAyMSw0LjM0MzE0NTc1IDIxLDYgTDIxLDE4IEMyMSwxOS42NTY4NTQyIDE5LjY1Njg1NDIsMjEgMTgsMjEgTDYsMjEgQzQuMzQzMTQ1NzUsMjEgMywxOS42NTY4NTQyIDMsMTggTDMsNiBDMyw0LjM0MzE0NTc1IDQuMzQzMTQ1NzUsMyA2LDMgTDE4LDMgWiBNMTYuNDY5NjY5OSw3Ljk2OTY2OTkxIEwxMCwxNC40MzkzMzk4IEw3LjUzMDMzMDA5LDExLjk2OTY2OTkgQzcuMjM3NDM2ODcsMTEuNjc2Nzc2NyA2Ljc2MjU2MzEzLDExLjY3Njc3NjcgNi40Njk2Njk5MSwxMS45Njk2Njk5IEM2LjE3Njc3NjcsMTIuMjYyNTYzMSA2LjE3Njc3NjcsMTIuNzM3NDM2OSA2LjQ2OTY2OTkxLDEzLjAzMDMzMDEgTDkuNDY5NjY5OTEsMTYuMDMwMzMwMSBDOS43NjI1NjMxMywxNi4zMjMyMjMzIDEwLjIzNzQzNjksMTYuMzIzMjIzMyAxMC41MzAzMzAxLDE2LjAzMDMzMDEgTDE3LjUzMDMzMDEsOS4wMzAzMzAwOSBDMTcuODIzMjIzMyw4LjczNzQzNjg3IDE3LjgyMzIyMzMsOC4yNjI1NjMxMyAxNy41MzAzMzAxLDcuOTY5NjY5OTEgQzE3LjIzNzQzNjksNy42NzY3NzY3IDE2Ljc2MjU2MzEsNy42NzY3NzY3IDE2LjQ2OTY2OTksNy45Njk2Njk5MSBaIiBpZD0i8J+OqC1Db2xvciI+PC9wYXRoPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+";
                        
                    selector("#user_names").appendChild(checkbox);

                    checkbox_label.appendChild(checkbox_label_img_1);

                    checkbox_label.appendChild(checkbox_label_img_2);

                    checkbox_label.appendChild(checkbox_label_span);

                    selector("#user_names").appendChild(checkbox_label);

                    selector("#user_names").appendChild(document.createElement("br"));

                });
                
                selector("#private_message").value = "";
            
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
    socket.onclose = event => {

        selector("#server_error > h2").innerText = "Connection Closed";

        selector("#server_error").classList.remove("hide");

    };

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

    // sending a leave_chat request to server if user pressed button
    selector("#leave").addEventListener("click", event => {

        // prevents page reloading
        event.preventDefault();

        // providing requset message
        var messageJSON = {
            request: "leave",
            from: selector("#chat_user").value
        };

        // sedning Json encoded request 
        socket.send(JSON.stringify(messageJSON));

        // reloading the page
        window.location.reload(false);

    });

    // sending a private_message request to server if user pressed button
    selector("#users").addEventListener("submit", event => {

        // prevents page reloading
        event.preventDefault();

        var testelement = selector("#sendPrivateMessage");

        // checking if the the request is valid, meaning user already sent for participants and now choosed some
        if (typeof (testelement) != 'undefined' && testelement != null) {

            var checks = selector("#user_names").childNodes;

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

                selector("#refresh_users").click();

                selector("#users_box").classList.remove("active");

            }

            // alerting error if user didn't chose anyone but pressed the button
            else alert("You didn't choose any user!");

        }

    });

});