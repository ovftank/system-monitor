export namespace main {
    export class AuthResponse {
        status: string;
        token: string;
        expires_at: number;
        message: string;

        static createFrom(source: any = {}) {
            return new AuthResponse(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.status = source['status'];
            this.token = source['token'];
            this.expires_at = source['expires_at'];
            this.message = source['message'];
        }
    }
    export class CheckTokenResponse {
        status: string;
        account_status: number;
        license_expire: number;
        message: string;

        static createFrom(source: any = {}) {
            return new CheckTokenResponse(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.status = source['status'];
            this.account_status = source['account_status'];
            this.license_expire = source['license_expire'];
            this.message = source['message'];
        }
    }
    export class Sensor {
        name: string;
        sensorType: string;
        value: number;
        unit: string;

        static createFrom(source: any = {}) {
            return new Sensor(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.name = source['name'];
            this.sensorType = source['sensorType'];
            this.value = source['value'];
            this.unit = source['unit'];
        }
    }
    export class Hardware {
        name: string;
        hardwareType: string;
        sensors: Sensor[];

        static createFrom(source: any = {}) {
            return new Hardware(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.name = source['name'];
            this.hardwareType = source['hardwareType'];
            this.sensors = this.convertValues(source['sensors'], Sensor);
        }

        convertValues(a: any, classs: any, asMap: boolean = false): any {
            if (!a) {
                return a;
            }
            if (a.slice && a.map) {
                return (a as any[]).map((elem) => this.convertValues(elem, classs));
            } else if ('object' === typeof a) {
                if (asMap) {
                    for (const key of Object.keys(a)) {
                        a[key] = new classs(a[key]);
                    }
                    return a;
                }
                return new classs(a);
            }
            return a;
        }
    }
    export class ClientData {
        hostName: string;
        localIP: string;
        hardware: Hardware[];

        static createFrom(source: any = {}) {
            return new ClientData(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.hostName = source['hostName'];
            this.localIP = source['localIP'];
            this.hardware = this.convertValues(source['hardware'], Hardware);
        }

        convertValues(a: any, classs: any, asMap: boolean = false): any {
            if (!a) {
                return a;
            }
            if (a.slice && a.map) {
                return (a as any[]).map((elem) => this.convertValues(elem, classs));
            } else if ('object' === typeof a) {
                if (asMap) {
                    for (const key of Object.keys(a)) {
                        a[key] = new classs(a[key]);
                    }
                    return a;
                }
                return new classs(a);
            }
            return a;
        }
    }
    export class Client {
        clientId: string;
        data: ClientData;

        static createFrom(source: any = {}) {
            return new Client(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.clientId = source['clientId'];
            this.data = this.convertValues(source['data'], ClientData);
        }

        convertValues(a: any, classs: any, asMap: boolean = false): any {
            if (!a) {
                return a;
            }
            if (a.slice && a.map) {
                return (a as any[]).map((elem) => this.convertValues(elem, classs));
            } else if ('object' === typeof a) {
                if (asMap) {
                    for (const key of Object.keys(a)) {
                        a[key] = new classs(a[key]);
                    }
                    return a;
                }
                return new classs(a);
            }
            return a;
        }
    }

    export class Config {
        ServerIP: string;
        DelayMs: number;

        static createFrom(source: any = {}) {
            return new Config(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.ServerIP = source['ServerIP'];
            this.DelayMs = source['DelayMs'];
        }
    }

    export class MonitorResponse {
        totalClients: number;
        clients: Client[];

        static createFrom(source: any = {}) {
            return new MonitorResponse(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.totalClients = source['totalClients'];
            this.clients = this.convertValues(source['clients'], Client);
        }

        convertValues(a: any, classs: any, asMap: boolean = false): any {
            if (!a) {
                return a;
            }
            if (a.slice && a.map) {
                return (a as any[]).map((elem) => this.convertValues(elem, classs));
            } else if ('object' === typeof a) {
                if (asMap) {
                    for (const key of Object.keys(a)) {
                        a[key] = new classs(a[key]);
                    }
                    return a;
                }
                return new classs(a);
            }
            return a;
        }
    }
    export class RegisterResponse {
        status: string;
        message: string;
        account_id: number;
        username: string;

        static createFrom(source: any = {}) {
            return new RegisterResponse(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.status = source['status'];
            this.message = source['message'];
            this.account_id = source['account_id'];
            this.username = source['username'];
        }
    }
}
