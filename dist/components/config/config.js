'use strict';

System.register(['./config.html!text', './dsUpgrade'], function (_export, _context) {
  "use strict";

  var configTemplate, DatasourceUpgrader, _createClass, WorldPingConfigCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_configHtmlText) {
      configTemplate = _configHtmlText.default;
    }, function (_dsUpgrade) {
      DatasourceUpgrader = _dsUpgrade.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('ConfigCtrl', WorldPingConfigCtrl = function () {
        function WorldPingConfigCtrl($scope, $injector, $q, backendSrv, alertSrv, contextSrv, datasourceSrv) {
          _classCallCheck(this, WorldPingConfigCtrl);

          this.$q = $q;
          this.backendSrv = backendSrv;
          this.alertSrv = alertSrv;
          this.validKey = false;
          this.quotas = {};
          this.appEditCtrl.setPreUpdateHook(this.preUpdate.bind(this));
          this.appEditCtrl.setPostUpdateHook(this.postUpdate.bind(this));
          this.org = null;
          this.datasourceUpgrader = new DatasourceUpgrader(contextSrv, backendSrv, $q, datasourceSrv);

          if (this.appModel.jsonData === null) {
            this.appModel.jsonData = {};
          }
          if (!this.appModel.secureJsonData) {
            this.appModel.secureJsonData = {};
          }
          if (this.appModel.enabled) {
            this.validateKey();
          }
        }

        _createClass(WorldPingConfigCtrl, [{
          key: 'reset',
          value: function reset() {
            this.appModel.jsonData.apiKeySet = false;
            this.validKey = false;
            this.errorMsg = "";
            this.org = null;
          }
        }, {
          key: 'validateKey',
          value: function validateKey() {
            var self = this;
            var p = this.backendSrv.get('api/plugin-proxy/raintank-worldping-app/api/v2/quotas');
            p.then(function (resp) {
              if (resp.meta.code !== 200) {
                self.alertSrv.set("failed to get Quotas", resp.message, 'error', 10000);
                return self.$q.reject(resp.message);
              }
              self.validKey = true;
              self.errorMsg = "";
              self.quotas = resp.body;

              self.getOrgDetails();
            }, function (resp) {
              if (self.appModel.enabled) {
                self.alertSrv.set("failed to verify apiKey", resp.statusText, 'error', 10000);
                self.appModel.enabled = false;
                self.appModel.jsonData.apiKeySet = false;
                self.appModel.secureJsonData.apiKey = "";
                self.errorMsg = "invalid apiKey";
                self.validKey = false;
              }
            });
            return p;
          }
        }, {
          key: 'getOrgDetails',
          value: function getOrgDetails() {
            var self = this;
            var p = this.backendSrv.get('api/plugin-proxy/raintank-worldping-app/api/grafana-net/profile/org');
            p.then(function (resp) {
              self.org = resp;

              var millionChecksPerMonth = Math.ceil(parseInt(self.org.checksPerMonth, 10) / 100000) / 10;
              if (millionChecksPerMonth > 1000) {
                self.org.strChecksPerMonth = Math.ceil(millionChecksPerMonth / 1000) + ' Billion';
              } else if (millionChecksPerMonth > 0) {
                self.org.strChecksPerMonth = millionChecksPerMonth + ' Million';
              } else {
                self.org.strChecksPerMonth = 'N/A';
              }
            }, function (resp) {
              self.alertSrv.set("failed to get Org Details", resp.statusText, 'error', 10000);
            });
            return p;
          }
        }, {
          key: 'preUpdate',
          value: function preUpdate() {
            var model = this.appModel;
            if (!model.enabled) {
              model.jsonData.apiKeySet = false;
              model.secureJsonData.apiKey = "";
              return this.$q.resolve();
            }

            if (!model.jsonData.apiKeySet && !model.secureJsonData.apiKey) {
              model.enabled = false;
              this.errorMsg = "apiKey not set";
              this.validKey = false;
              return this.$q.reject("apiKey not set.");
            }
            model.jsonData.apiKeySet = true;
            return this.$q.resolve();
          }
        }, {
          key: 'postUpdate',
          value: function postUpdate() {
            if (!this.appModel.enabled) {
              return this.$q.resolve();
            }
            var self = this;
            return this.validateKey().then(function () {
              return self.datasourceUpgrader.upgrade().then(function () {
                self.appEditCtrl.importDashboards().then(function () {
                  return {
                    url: "dashboard/db/worldping-home",
                    message: "worldPing app installed!"
                  };
                });
              });
            });
          }
        }]);

        return WorldPingConfigCtrl;
      }());

      WorldPingConfigCtrl.template = configTemplate;

      _export('ConfigCtrl', WorldPingConfigCtrl);
    }
  };
});
//# sourceMappingURL=config.js.map
