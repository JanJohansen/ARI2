import { InjectionToken } from "@angular/core"
import AriClientServer from "../server/ariClientServer"

/*
__value = value may not be transmitted to or      received from clients/services (Internal use only)
_value  = value may     be transmitted to but not received from clients/services (Internal, but informal for clients)
value   = value may     be transmitted to and     received from clients/services (Client values)
*/

export interface iObject {
    //_type: "iObject" | "oObject" | "ioObject" | "object";
    name: string;
    description?: string;

    //[name: string]: iMembers | iFunction | iValue;
}
interface iMembers {
     [name: string]: iAriObjectModel | iFunction | iValue;
}

export type iAriObjectModel = iObject & iMembers;

export interface iFunction {
    name: string;
    __callback?: (any)=>any;
    type: "function";
    description?: string;
}

export interface iValue {
    name: string;
    ts?: Date;
    type: 
        "iNumber" | "oNumber" | "ioNumber" |
	    "iString" | "oString" | "ioString" |
	    "iBoolean" | "oBoolean" | "ioBoolean" |
        "iObject" | "oObject" | "ioObject";
    value: any;
    description?: string;
    //[name: string]: any;
}

export interface iNonAriMembers {
    [name: string]: any;
}

export interface iClient {
    __name: string;
    __clientServer: AriClientServer;
    _connected: boolean;
    _authenticated: boolean;
    type: "object",
    description?: string;
}

export type iClientModel = iClient & iNonAriMembers ;




