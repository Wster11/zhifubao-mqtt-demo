import mqtt from "../../utils/mqtt.min.js";
const host = "alis://xxx.xxx.xxx.xx"; //环信MQTT服务器地址 通过console后台[MQTT]->[服务概览]->[服务配置]下[连接地址]获取

/**
 * 推荐使用真机调试、模拟器websocket连接不稳定
 */

var deviceId = "deviceId"; // MQTT 用户自定义deviceID

var appId = "appId"; // appID 通过console后台[MQTT]->[服务概览]->[服务配置]下[AppID]获取

var restApiUrl = "restApiUrl"; // 环信MQTT REST API地址 通过console后台[MQTT]->[服务概览]->[服务配置]下[REST API地址]获取

var username = "username"; // 自定义用户名 长度不超过64位即可

var appClientId = "appClientId"; // 开发者ID 通过console后台[应用概览]->[应用详情]->[开发者ID]下[ Client ID]获取

var appClientSecret = "appClientSecret"; // 开发者密钥 通过console后台[应用概览]->[应用详情]->[开发者ID]下[ ClientSecret]获取

var clientId = deviceId + "@" + appId

Page({
  data: {
    client: null,
    //记录重连的次数
    reconnectCounts: 0,
    //MQTT连接的配置
    options: {
      keepalive: 45, // 45s
      clean: true, // cleanSession不保持持久会话
      protocolVersion: 4, // MQTT连接协议版本
      clientId: clientId, // deviceID@AppID
      password: "", // 用户token, 可以通过getAppToken方法获取,或者去console控制台获取对应的token
      username: username, // 自定义用户名 长度不超过64位即可
      reconnectPeriod: 1000, //1000毫秒，两次重新连接之间的间隔 设置为0则关闭自动重链
      connectTimeout: 30 * 1000, //30 * 1000毫秒，两次重新连接之间的间隔
      resubscribe: true, //如果连接断开并重新连接，则会再次自动订阅已订阅的主题（默认true）
      my: my //注意这里的my
    }
  },
  onLoad(query) {
    console.info(`Page onLoad with query: ${JSON.stringify(query)}`);
  },
  onReady() {
    // 页面加载完成
  },
  onShow() {
    // 页面显示
  },
  connect() {
    // 连接未断开,重复链接会导致reconnect循环
    console.log(this.data.options, "mqtt-options");
    var that = this;

    //开始连接
    this.data.client = mqtt.connect(host, this.data.options);
    this.data.client.on("connect", function (connack) {
      console.log("服务器连接成功", connack);
      that.toast("服务器连接成功");
    });

    //服务器下发消息的回调
    this.data.client.on("message", function (topic, payload) {
      console.log("收到 topic:" + topic + " , payload :" + payload);
      that.toast("收到 topic:" + topic + " , payload :" + payload);
    });

    //服务器连接异常的回调
    this.data.client.on("error", function (error) {
      console.log("服务器 error 的回调" + error);
    });
    //服务器关闭连接回掉
    this.data.client.on("close", function () {
      console.log("服务器 close 回调");
      that.toast("关闭服务器连接成功");
    });

    //服务器重连连接异常的回调
    this.data.client.on("reconnect", function () {
      console.log("服务器 reconnect的回调");
    });
  },
  close() {
    this.data.client.end();
  },
  subOne() {
    var that = this;
    this.data.client.subscribe("Topic0", function (err, granted) {
      if (!err) {
        console.log(">>>>>>主题订阅成功");
        that.toast("订阅主题Topic0成功");
      } else {
        console.log(err);
      }
    });
  },
  unSubscribe() {
    var that = this;
    this.data.client.unsubscribe("Topic0", function (err) {
      if (!err) {
        console.log(">>>>>>主题取消订阅成功");
        that.toast("取消订阅Topic0成功");
      } else {
        console.log(err);
      }
    });
  },
  pubMsg: function () {
    if (this.data.client && this.data.client.connected) {
      this.data.client.publish("Topic0", "hello world");
    }
  },
  /**
   * 客户端获取appToken代码示例如下：
   */
  getAppToken: function () {
    let that = this;
    my.request({
      url: `${restApiUrl}/openapi/rm/app/token`,
      method: "POST",
      data: {
        appClientId: appClientId,
        appClientSecret: appClientSecret
      },
      headers: {
        "content-type": "application/json" //默认值
      },
      dataType: "json",
      success: function (res) {
        // 获取到的appToken
        let appToken = res.data.body.access_token;
        console.log("appToken", appToken);
        that.getUserToken(appToken);
      },
      fail: function (res) {
        my.alert({ content: "fail" });
      }
    });
  },
  /**
   * 客户端获取userToken(password)代码示例如下：
   */
  getUserToken: function (appToken) {
    let that = this;
    my.request({
      url: `${restApiUrl}/openapi/rm/user/token`,
      method: "POST",
      data: {
        username: username, // 用户名
        expires_in: 86400, // 过期时间，单位为秒，默认为3天，如需调整，可提工单调整
        cid: clientId
      },
      headers: {
        Authorization: appToken,
        "content-type": "application/json" //默认值
      },
      dataType: "json",
      success: function (res) {
        // 获取到的userToken
        let userToken = res.data.body.access_token;
        console.log("userToken", userToken);
        that.data.options.password = userToken;
        that.toast(userToken);
      },
      fail: function (res) {
        my.alert({ content: "fail" });
      }
    });
  },
  toast: function (content) {
    my.showToast({
      type: "info",
      content: content,
      duration: 2000
    });
  }
});
