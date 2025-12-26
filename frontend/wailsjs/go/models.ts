export namespace main {
    export class AppInfo {
        companyName: string;
        productName: string;
        productVersion: string;
        copyright: string;
        comments: string;

        static createFrom(source: any = {}) {
            return new AppInfo(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.companyName = source['companyName'];
            this.productName = source['productName'];
            this.productVersion = source['productVersion'];
            this.copyright = source['copyright'];
            this.comments = source['comments'];
        }
    }
    export class AuthResponse {
        success: boolean;
        message: string;
        data?: string;

        static createFrom(source: any = {}) {
            return new AuthResponse(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.success = source['success'];
            this.message = source['message'];
            this.data = source['data'];
        }
    }
    export class CheckTokenResponse {
        success: boolean;
        message: string;
        data?: any;

        static createFrom(source: any = {}) {
            return new CheckTokenResponse(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.success = source['success'];
            this.message = source['message'];
            this.data = source['data'];
        }
    }
    export class Sensor {
        Name: string;
        SensorType: string;
        Value: number;
        Unit: string;

        static createFrom(source: any = {}) {
            return new Sensor(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.Name = source['Name'];
            this.SensorType = source['SensorType'];
            this.Value = source['Value'];
            this.Unit = source['Unit'];
        }
    }
    export class Hardware {
        Name: string;
        HardwareType: string;
        Sensors: Sensor[];

        static createFrom(source: any = {}) {
            return new Hardware(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.Name = source['Name'];
            this.HardwareType = source['HardwareType'];
            this.Sensors = this.convertValues(source['Sensors'], Sensor);
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
        HostName: string;
        LocalIP: string;
        Timestamp: number;
        Hardware: Hardware[];

        static createFrom(source: any = {}) {
            return new ClientData(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.HostName = source['HostName'];
            this.LocalIP = source['LocalIP'];
            this.Timestamp = source['Timestamp'];
            this.Hardware = this.convertValues(source['Hardware'], Hardware);
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
        ClientId: string;
        Data: ClientData;

        static createFrom(source: any = {}) {
            return new Client(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.ClientId = source['ClientId'];
            this.Data = this.convertValues(source['Data'], ClientData);
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
        TotalClients: number;
        Clients: Client[];

        static createFrom(source: any = {}) {
            return new MonitorResponse(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.TotalClients = source['TotalClients'];
            this.Clients = this.convertValues(source['Clients'], Client);
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
        success: boolean;
        message: string;
        data?: any;

        static createFrom(source: any = {}) {
            return new RegisterResponse(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.success = source['success'];
            this.message = source['message'];
            this.data = source['data'];
        }
    }

    export class UpdateCheckResult {
        hasUpdate: boolean;
        newVersion: string;
        error?: string;

        static createFrom(source: any = {}) {
            return new UpdateCheckResult(source);
        }

        constructor(source: any = {}) {
            if ('string' === typeof source) source = JSON.parse(source);
            this.hasUpdate = source['hasUpdate'];
            this.newVersion = source['newVersion'];
            this.error = source['error'];
        }
    }
}
