import mqtt from '../../utils/mqtt.min.js'
const host = 'alis://xxxxxx' // xxxx 为连接地址需要在console后台 MQTT首页概览获取

/**
 * 推荐使用真机调试、模拟器websocket连接不稳定
 * 
 * appId、baseUrl、orgName、appName 需从console控制台获取
 *
 */

var deviceId = 'deviceId' // MQTT 用户自定义deviceID

var appId = 'appId' // 从console控制台获取
var appName = 'appName' // appName
var orgName = 'orgName' // orgName
var baseUrl = 'baseUrl' // token域名 https://

var grantType = 'password' // 获取token接口的参数,不用改动

var username = '' // IM用户名
var password = '' // IM用户密码


Page({
  data: {
    client: null,
    //记录重连的次数
    reconnectCounts: 0,
    //MQTT连接的配置
    options: {
      keepalive: 60, //60s
      clean: true, //cleanSession不保持持久会话
      protocolVersion: 4, //MQTT连接协议版本
      clientId: deviceId + '@' + appId, // deviceID@AppID
      password: '', // 用户token, 可以通过getToken方法获取,或者去console控制台获取对应的token
      username: username, // IM用户名
      reconnectPeriod: 1000, //1000毫秒，两次重新连接之间的间隔 设置为0则关闭自动重链
      connectTimeout: 30 * 1000, //30 * 1000毫秒，两次重新连接之间的间隔
      resubscribe: true, //如果连接断开并重新连接，则会再次自动订阅已订阅的主题（默认true）
      my: my //注意这里的my
    }
  },
  onLoad(query) {
    console.info(`Page onLoad with query: ${JSON.stringify(query)}`)
  },
  onReady() {
    // 页面加载完成
  },
  onShow() {
    // 页面显示
  },
  connect() {
    // 连接未断开,重复链接会导致reconnect循环
    console.log(this.data.options, 'mqtt-options')
    var that = this

    //开始连接
    this.data.client = mqtt.connect(host, this.data.options)
    this.data.client.on('connect', function (connack) {
      console.log('服务器连接成功', connack)
      that.toast('服务器连接成功')
    })

    //服务器下发消息的回调
    this.data.client.on('message', function (topic, payload) {
      console.log('收到 topic:' + topic + ' , payload :' + payload)
      that.toast('收到 topic:' + topic + ' , payload :' + payload)
    })

    //服务器连接异常的回调
    this.data.client.on('error', function (error) {
      console.log('服务器 error 的回调' + error)
    })
    //服务器关闭连接回掉
    this.data.client.on('close', function () {
      console.log('服务器 close 回调')
      that.toast('关闭服务器连接成功')
    })

    //服务器重连连接异常的回调
    this.data.client.on('reconnect', function () {
      console.log('服务器 reconnect的回调')
    })
  },
  close() {
    this.data.client.end()
  },
  subOne() {
    var that = this
    this.data.client.subscribe('Topic0', function (err, granted) {
      if (!err) {
        console.log('>>>>>>主题订阅成功')
        that.toast('订阅主题Topic0成功')
      } else {
        console.log(err)
      }
    })
  },
  unSubscribe() {
    var that = this
    this.data.client.unsubscribe('Topic0', function (err) {
      if (!err) {
        console.log('>>>>>>主题取消订阅成功')
        that.toast('取消订阅Topic0成功')
      } else {
        console.log(err)
      }
    })
  },
  pubMsg: function () {
    if (this.data.client && this.data.client.connected) {
      this.data.client.publish('Topic0', 'hello world')
    }
  },
  /**
   * 客户端获取token(password)代码示例如下：
   */
  getToken: function () {
    let that = this
    my.request({
      url: baseUrl + '/' + orgName + '/' + appName + '/token',
      method: 'POST',
      data: {
        grant_type: grantType,
        username: username, // 用户名
        password: password // 用户登录密码
      },
      headers: {
        'content-type': 'application/json' //默认值
      },
      dataType: 'json',
      success: function (res) {
        // 获取到的access_token
        console.log('Token：' + res.data.access_token)
        
        console.log(that.data.options)
        that.data.options.password = res.data.access_token
        that.toast(res.data.access_token)
      },
      fail: function (res) {
        my.alert({ content: 'fail' })
      }
    })
  },
  toast: function (content) {
    my.showToast({
      type: 'info',
      content: content,
      duration: 2000
    })
  }
})
