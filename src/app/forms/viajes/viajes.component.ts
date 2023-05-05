import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { map, Observable, of, startWith } from 'rxjs';
import { Flight } from 'src/app/model/flight.model';
import { Journey } from 'src/app/model/journey.model';
import { FlightService } from 'src/app/service/flight.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-viajes',
  templateUrl: './viajes.component.html',
  styleUrls: ['./viajes.component.css']
})



export class ViajesComponent implements OnInit {

  constructor(private serviceVuelos: FlightService, private spinner: NgxSpinnerService, private fb: FormBuilder, private router: Router) { }
  private readonly ONEWAY = '0';
  private readonly MULTIFLIGHT = '1';
  private readonly ROUNDTRIP = '2';
  panelOpenState = true;

  listorigin: string[] = [];
  listDestination: string[] = [];
  listMonedas: string[] = ["USD", "COP", "EUR"];
  dataFlight: Journey = {};
  precios: number[] = [];

  filteredOptionorigin: Observable<string[]>;
  filteredOptionsdestination: Observable<string[]>;

  formViaje: FormGroup;





  get multitrip(): FormArray {
    return this.formViaje.get('multitrip') as FormArray;
  }
  addItem(): void {
    const item = this.fb.group({
      origin: ['', [Validators.required, Validators.minLength(3)]],
      destination: ['', [Validators.required, Validators.minLength(3)]]
    });
    this.multitrip.push(item);
  }

  deleteItem(index: number): void {
    if (this.multitrip.length > 1)
      this.multitrip.removeAt(index);
  }
  ngOnInit(): void {
    this.spinner.show(undefined, { fullScreen: true });

    this.formViaje = this.fb.group({
      origin: ['', [Validators.required, Validators.minLength(3)]],
      destination: ['', [Validators.required, Validators.minLength(3)]],
      multitrip: this.fb.array([
        this.fb.group({
          origin: [''],
          destination: ['']
        })
      ]),
      scales: [0],
      typeFlight: [this.ONEWAY],
      currency: ['USD']
    });

    this.serviceVuelos.getAll().subscribe({
      next: (resp: Flight[]) => {
        this.spinner.hide();

        resp.forEach(x => {
          if (this.listorigin.find(y => y == x.origin) == undefined) {
            this.listorigin.push(x.origin);
          };
          if (this.listDestination.find(y => y == x.destination) == undefined) {
            this.listDestination.push(x.destination);
          }
        })

      },
      error: (error: any) => {
        this.spinner.hide();
        Swal.fire("Error", error.error.Message, 'error');
      }
    })


    this.multitrip?.valueChanges.subscribe(changes => {
      console.log('Form value changed: ', changes);
      changes.forEach((element, index) => {
        let origin = element?.origin?.toUpperCase();
        let destination = element?.destination?.toUpperCase();
        if (this.multitrip.controls[index + 1]) {
          this.multitrip.controls[index + 1].get('origin').setValue(destination, { emitEvent: false });
        }

        this.filteredOptionorigin = of(this._filterListaorigin(origin, changes.map(g => g.destination)));
        this.filteredOptionsdestination = of(this._filterListDestination(destination, changes.map(g => g.origin)));
      });
    });

    this.filteredOptionorigin = this.formViaje.get("origin").valueChanges.pipe(
      startWith(''),
      map((value: string) => this._filterListaorigin(value.toUpperCase(), [this.formViaje.get("destination").value.toUpperCase()]))
    );

    this.filteredOptionsdestination = this.formViaje.get("destination").valueChanges.pipe(
      startWith(''),
      map((value: string) => this._filterListDestination(value.toUpperCase(), this.formViaje.get("destination").value.toUpperCase()))
    );
    this.onChangeMoneda();
    this.onTypeFlightChange();

  }


  onSubmit() {

    if (!this.formViaje.valid) {
      Swal.fire("It's something going bad ", "please validate the data to seach before to try to send again", "warning");
      return;
    }

    let viaje: Flight = {
      ...this.formViaje.value,
      origin: this.formViaje.get('typeFlight').value == this.MULTIFLIGHT ? '' : this.formViaje.get('origin').value.toUpperCase(),
      destination: this.formViaje.get('typeFlight').value == this.MULTIFLIGHT ? '' : this.formViaje.get('destination').value.toUpperCase(),
      currency: this.formViaje.get('currency').value,
    };

    this.spinner.show(undefined, { fullScreen: true });

    this.serviceVuelos.get(viaje).subscribe({
      next: (resp: Journey) => {
        this.spinner.hide();
        this.dataFlight = { ...resp }
        if (this.dataFlight.flights.length == 0)
          Swal.fire("Informacion", "No pudimos encontrar una ruta de acuerdo a tu busqueda", "info");

      },
      error: (err: any) => {
        Swal.fire("Error", "Error al traer los datos", "error");
        this.spinner.hide();
      }
    });
  }

  onSalir() {
    localStorage.removeItem("login");
    this.router.navigateByUrl('/login');

  }



  onTypeFlightChange() {
    const itemsFormArray = this.formViaje.get('multitrip') as FormArray;
    this.formViaje.get("typeFlight").valueChanges.subscribe(type => {
      if (type == this.MULTIFLIGHT) {

        itemsFormArray.controls.forEach(control => {
          control.get('origin').setValidators([Validators.required, Validators.minLength(3)]);
          control.get('destination').setValidators([Validators.required, Validators.minLength(3)]);
        });

        this.formViaje.get('destination').clearValidators();
        this.formViaje.get('origin').clearValidators();
      } else {
        itemsFormArray.controls.forEach(control => {
          control.get('origin').clearValidators();
          control.get('origin').updateValueAndValidity();
          control.get('destination').clearValidators();
          control.get('destination').updateValueAndValidity();
        });
        this.formViaje.get('origin').addValidators([Validators.required, Validators.minLength(3)]);
        this.formViaje.get('destination').addValidators([Validators.required, Validators.minLength(3)]);

      }
      this.formViaje.get('origin').updateValueAndValidity();
      this.formViaje.get('destination').updateValueAndValidity();
    })
  }

  onChangeMoneda() {
    this.formViaje.get("currency").valueChanges.subscribe(c => {
      this.onSubmit();
    })
  }

  private _filterListaorigin(value: string, exclude: string[]): string[] {
    return this.listorigin.filter(option => option.includes(value) && !exclude.includes(option));
  }
  private _filterListDestination(value: string, exclude: string[]): string[] {
    return this.listDestination.filter(option => option.includes(value) && !exclude.includes(option));
  }
}
