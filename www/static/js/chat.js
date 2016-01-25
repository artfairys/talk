! function() {
	// 工具类
	function query(selector) {
		return document.querySelector(selector);
	}

	// 模版
	function generateHTML(el, data) {
		var msgHTML = query(el).innerHTML;

		function generate(data) {
			if (typeof(data) === 'string') {
				return msgHTML.replace(/\{(\w+)\}/g, function($0, $1) {
					return data;
				});

			} else {
				return msgHTML.replace(/\{(\w+)\}/g, function($0, $1) {
					return data[$1];
				});
			}
		}
		return Array.isArray(data) ? data.map(generate).join('') : generate(data);
	}

	function getRoomByUrl() {
		return location.search.match(/room=(\w+)?($|&)/)[1];
	}

	function renderTip(tip) {
		chatHistory.innerHTML += generateHTML('#tip-tpl', tip);
	}

    function twinklingUser(msgUser, second) {
        $(".user-list").children("li").each(function(i, item) {
            if($(item).text() === msgUser) {
                $(item).css({"-webkit-animation":"twinkling 1s infinite ease-in-out"});
                setTimeout(function(){
                    $(item).css({"-webkit-animation": ""});
                }, second||5000);
            }
        })
    }

	function renderUsrList(users) {
		var usrList = query('.user-list');
		usrList.innerHTML = generateHTML('#usr-tpl', users);
	}

	function scrollHistoryBottom() {
		chatHistory.scrollTop = chatHistory.scrollHeight;
	}

	var name = localStorage.getItem('name');
	var id = localStorage.getItem('id');

	var sendBtn = query('.btn-send');
	var chatHistory = query('.chat-history');
	var inputBox = query('.input-box');
	var addMsg = function() {
		var msg = inputBox.innerText;
		inputBox.innerText = '';
		chatHistory.innerHTML += generateHTML('#msg-mine-tpl', {
			displayName: name,
			message: twemoji.parse(msg)
		});

		scrollHistoryBottom();
		socket.emit('chat', {
			room: getRoomByUrl(),
			userId: id,
			message: msg
		})
	};

	// 如果用户没登录就跳转给用户去登录
	if (!name || !id) {
		window.location.href = '/index/login' + location.search;
	}

	var socket = io(socketUrl);
	socket.emit('adduser', {
		room: getRoomByUrl(),
		userId: id,
		displayName: name
	});

	socket.on('user:login', function(data) {
		var usrList = query('.user-list');
		localStorage.setItem('id', data.userId);
		usrList.innerHTML = generateHTML('#usr-tpl', data.users);
	});

	socket.on('user:join', function(data) {
		renderUsrList(data.users);
		renderTip(data.join + '已进入');
		scrollHistoryBottom();
	});

	socket.on('user:exit', function(data) {
		renderUsrList(data.users);
		renderTip(data.exit + '已退出');
		scrollHistoryBottom();
	});

	socket.on('chat', function(data) {
		data.message = twemoji.parse(data.message);
		chatHistory.innerHTML += generateHTML('#msg-tpl', data);
        twinklingUser(data.displayName, 3000);
		scrollHistoryBottom();
	});

	sendBtn.addEventListener('click', addMsg);
	inputBox.addEventListener('keyup', function(e) {
		if (e.keyCode == 13) {
			addMsg();
		}
	});

    // 二维码分享a
    $('#qrcode').children(".qr-content").qrcode({
                width: 256,
                height: 256,
                text: location.href
            })
          .end().children(".qr-des").text(location.href)
    $(".qr-share").on("click", function(e) {
        Custombox.open({
            target: "#qrcode",
            effect: "fadein"
        });
        e.preventDefault();
    })
}()
