// WeChat SDK Integration Script
// This script loads the WeChat JS-SDK for web applications

(function() {
  'use strict';
  
  // WeChat SDK configuration
  const WECHAT_APPID = process.env.REACT_APP_WECHAT_APPID || 'your_wechat_appid';
  
  // Load WeChat JS-SDK
  function loadWeChatSDK() {
    return new Promise((resolve, reject) => {
      if (window.wx) {
        resolve(window.wx);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
      script.onload = () => {
        if (window.wx) {
          resolve(window.wx);
        } else {
          reject(new Error('WeChat SDK failed to load'));
        }
      };
      script.onerror = () => {
        reject(new Error('Failed to load WeChat SDK'));
      };
      document.head.appendChild(script);
    });
  }
  
  // Initialize WeChat SDK
  function initWeChatSDK() {
    return new Promise((resolve, reject) => {
      loadWeChatSDK().then(wx => {
        // Get signature from backend
        fetch('/api/wechat/signature', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: window.location.href.split('#')[0] // Remove hash for signature
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            reject(new Error(data.error));
            return;
          }
          
          // Configure WeChat SDK
          wx.config({
            debug: false, // Set to true for debugging
            appId: WECHAT_APPID,
            timestamp: data.timestamp,
            nonceStr: data.nonceStr,
            signature: data.signature,
            jsApiList: [
              'checkJsApi',
              'onMenuShareTimeline',
              'onMenuShareAppMessage',
              'onMenuShareQQ',
              'onMenuShareWeibo',
              'onMenuShareQZone',
              'hideMenuItems',
              'showMenuItems',
              'hideAllNonBaseMenuItem',
              'showAllNonBaseMenuItem',
              'chooseImage',
              'previewImage',
              'uploadImage',
              'downloadImage',
              'getNetworkType',
              'openLocation',
              'getLocation',
              'scanQRCode',
              'chooseWXPay',
              'openProductSpecificView',
              'addCard',
              'chooseCard',
              'openCard'
            ]
          });
          
          wx.ready(() => {
            console.log('WeChat SDK initialized successfully');
            resolve(wx);
          });
          
          wx.error((res) => {
            console.error('WeChat SDK initialization failed:', res);
            reject(new Error('WeChat SDK initialization failed'));
          });
        })
        .catch(error => {
          console.error('Failed to get WeChat signature:', error);
          reject(error);
        });
      }).catch(reject);
    });
  }
  
  // WeChat login helper
  function sendAuthReq(options = {}) {
    return new Promise((resolve, reject) => {
      if (!window.wx) {
        reject(new Error('WeChat SDK not loaded'));
        return;
      }
      
      const req = {
        scope: 'snsapi_userinfo', // Only snsapi_userinfo is allowed
        state: options.state || 'wechat_login_' + Date.now(),
        ...options
      };
      
      window.wx.sendAuthReq({
        ...req,
        success: (res) => {
          resolve(res);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
  
  // Check if WeChat is installed (for mobile apps)
  function isWXAppInstalled() {
    return new Promise((resolve) => {
      if (!window.wx) {
        resolve(false);
        return;
      }
      
      window.wx.isWXAppInstalled({
        success: () => resolve(true),
        fail: () => resolve(false)
      });
    });
  }
  
  // Export functions to global scope
  window.WeChatSDK = {
    init: initWeChatSDK,
    sendAuthReq: sendAuthReq,
    isWXAppInstalled: isWXAppInstalled,
    loadSDK: loadWeChatSDK
  };
  
  // Auto-initialize if in WeChat environment
  if (navigator.userAgent.toLowerCase().indexOf('micromessenger') !== -1) {
    initWeChatSDK().catch(error => {
      console.warn('Auto-initialization failed:', error);
    });
  }
})();
