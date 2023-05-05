import { Flight } from "./flight.model";

export class Journey {
    flights?: Array<Flight[]>;
    origin?: string;
    destination?: string;
    price?: number;
}

