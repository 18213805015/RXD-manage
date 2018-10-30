(function($, owner) {
	/**
	 * 用户登录
	 **/
	 var mask=mui.createMask();//遮罩层

	owner.login = function(loginInfo, callback) {
		callback = callback || $.noop;
		loginInfo = loginInfo || {};
		loginInfo.username = loginInfo.username || '';
		loginInfo.password = loginInfo.password || '';
		if (loginInfo.username.length == '') {
			return callback('请输入用户名');
		}
		if (loginInfo.password.length == '') {
			return callback('请输入密码');
		}
/* 		//从服务器获取登陆数据验证结果
				var users = JSON.parse(localStorage.getItem('$users') || '[]');
				var authed = users.some(function(user) {
					return loginInfo.username == user.username && loginInfo.password == user.password;
				});
				if (authed) {
					return owner.createState(loginInfo.username, callback);
				} else {
					return callback('用户名或密码错误');
				} */ 

		mui.ajax('http://192.168.0.110:8080/api/user/login', {
			type: 'POST',
			data: loginInfo,
			dataType: 'json', //服务器返回json格式数据
			timeout: 100000, //10秒超时
			headers: {
				'contentType': "application/x-www-form-urlencoded"
			}, 
			beforeSend: function() {
				plus.nativeUI.showWaiting('登陆中...',{background:'#00bfff'});
				mask.show(); //显示遮罩层
			},
			complete: function() {
				plus.nativeUI.closeWaiting();
				mask.close(); //关闭遮罩层
			},
			success: function(user) {
				if (user) {
					var users = JSON.parse(localStorage.getItem('$users') || '[]');
					users = user;
					localStorage.setItem('$users', JSON.stringify(users)); /*用户信息的本地存储*/
					return owner.createState(loginInfo.username, callback);
				} else {
					return callback('用户名或密码错误!');
				}
			},
			error: function(xhr, type, errorThrown) {
				console.log(xhr + type + errorThrown);
				return callback('网络错误，请检查网络数据连接是否开启!');
				//TODO 此处可以向服务端告警
			}
		});
	};

	owner.createState = function(name, callback) {
		var state = owner.getState();
		state.username = name;
		state.token = "token123456789";
		owner.setState(state);
		return callback();
	};

	/**
	 * 新用户注册
	 **/
	owner.reg = function(regInfo, callback) {
		callback = callback || $.noop;
		regInfo = regInfo || {};
		regInfo.username = regInfo.username || '';
		regInfo.password = regInfo.password || '';
		if (regInfo.username.length < 5) {
			return callback('用户名最短需要 5 个字符');
		}
		if (regInfo.password.length < 6) {
			return callback('密码最短需要 6 个字符');
		}
		if (!checkEmail(regInfo.email)) {
			return callback('邮箱地址不合法');
		}
		var users = JSON.parse(localStorage.getItem('$users') || '[]');
		users.push(regInfo);
		localStorage.setItem('$users', JSON.stringify(users));
		return callback();
	};

	owner.alter = function(alterInfo, callback) {
		mui.ajax('http://192.168.0.110:8080/api/user/upwd', {
			type: 'POST',
			data: alterInfo,
			dataType: 'json', //服务器返回json格式数据
			timeout: 10000, //10秒超时
			headers: {
				'contentType': "application/x-www-form-urlencoded"
			},
			beforeSend: function() {
				plus.nativeUI.showWaiting('修改中...',{background:'#00bfff'});
				mask.show(); //显示遮罩层
			},
			complete: function() {
				plus.nativeUI.closeWaiting();
				mask.close(); //关闭遮罩层
			},
			success: function(rsp) {
				if (rsp) {
					return callback('密码修改成功！');
				} else {
					return callback('原密码输入错误，密码修改失败！');
				}
			},
			error: function(xhr, type, errorThrown) {

				return callback('网络错误，请检查网络数据连接是否开启!');
				//TODO 此处可以向服务端告警

			}
		});
	};

	/**
	 * 获取当前状态
	 **/
	owner.getState = function() {
		var stateText = localStorage.getItem('$state') || "{}";
		return JSON.parse(stateText);
	};

	/**
	 * 设置当前状态
	 **/
	owner.setState = function(state) {
		state = state || {};
		localStorage.setItem('$state', JSON.stringify(state));
		//var settings = owner.getSettings();
		//settings.gestures = '';
		//owner.setSettings(settings);
	};

	var checkEmail = function(email) {
		email = email || '';
		return (email.length > 3 && email.indexOf('@') > -1);
	};

	/**
	 * 找回密码
	 **/
	owner.forgetPassword = function(email, callback) {
		callback = callback || $.noop;
		if (!checkEmail(email)) {
			return callback('邮箱地址不合法');
		}
		return callback(null, '新的随机密码已经发送到您的邮箱，请查收邮件。');
	};

	/**
	 * 获取应用本地配置
	 **/
	owner.setSettings = function(settings) {
		settings = settings || {};
		localStorage.setItem('$settings', JSON.stringify(settings));
	}

	/**
	 * 设置应用本地配置
	 **/
	owner.getSettings = function() {
		var settingsText = localStorage.getItem('$settings') || "{}";
		return JSON.parse(settingsText);
	}
	/**
	 * 获取本地是否安装客户端
	 **/
	owner.isInstalled = function(id) {
		if (id === 'qihoo' && mui.os.plus) {
			return true;
		}
		if (mui.os.android) {
			var main = plus.android.runtimeMainActivity();
			var packageManager = main.getPackageManager();
			var PackageManager = plus.android.importClass(packageManager)
			var packageName = {
				"qq": "com.tencent.mobileqq",
				"weixin": "com.tencent.mm",
				"sinaweibo": "com.sina.weibo"
			}
			try {
				return packageManager.getPackageInfo(packageName[id], PackageManager.GET_ACTIVITIES);
			} catch (e) {}
		} else {
			switch (id) {
				case "qq":
					var TencentOAuth = plus.ios.import("TencentOAuth");
					return TencentOAuth.iphoneQQInstalled();
				case "weixin":
					var WXApi = plus.ios.import("WXApi");
					return WXApi.isWXAppInstalled()
				case "sinaweibo":
					var SinaAPI = plus.ios.import("WeiboSDK");
					return SinaAPI.isWeiboAppInstalled()
				default:
					break;
			}
		}
	}
	owner.dayNum = function(start, end) {
		var startDate = new Date(start);
		var endDate = new Date(end);
		if (startDate <= endDate) {
			return (endDate - startDate) / (3600 * 24 * 1000) + 1;
		} else {
			return (endDate - startDate) / (3600 * 24 * 1000) - 1;
		}
	}
	// 	owner.find = function (username){
	// 		var state = app.getState();
	// 		var username = state.username;
	// 		var users = JSON.parse(localStorage.getItem("$users") || '[]');
	// 		var userinfo;
	// 		users.some(function(user) {
	// 			if (user.username == username)
	// 			{
	// 				userinfo = user;
	// 			}	
	// 		});
	// 		return userinfo;
	// 	}
}(mui, window.app = {}));
