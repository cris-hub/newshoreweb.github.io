import { Transport } from "./transport.model";

export class Flight {
    transport?: Transport;
    origin: string;
    destination: string;
    price: number;
    currency: string;
    scales: number;
    typeFlight:string;
    multitrip : Array<Flight>;
}   