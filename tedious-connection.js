module.exports = function (RED) {
    function TediousConnection(config) {
        RED.nodes.createNode(this, config);

        this.server = config.server;
        this.username = config.username;
        this.password = this.credentials.password;
    }

    RED.nodes.registerType("tedious-connection", TediousConnection, {
        credentials: {
            password: { type: "password" }
        }
    });
}