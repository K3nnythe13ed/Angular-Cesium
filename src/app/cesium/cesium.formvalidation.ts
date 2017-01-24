import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'form-validation',
  template : `
 <div class="modal_enter">
        <div #modal class="modal fade" data-modal-color="gray" id="MyModal" role="dialog">
            <div class="modal-dialog">

                <!-- Modal content / used after drawing a new marker on the map-->
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                        <h4 class="modal-title" id="loctitle"></h4>
                    </div>

                    <div class="modal-body">
                        // tslint:disable-next-line:max-line-length
                        <form #locationform id="locationform" onsubmit="return false" [formGroup]="complexForm" (ngSubmit)="submitForm(complexForm.value)">
                            <div class="form-group row" [ngClass]="{'has-error':!complexForm.controls['firstName'].valid && complexForm.controls['firstName'].touched}"> 
                                <label for="locname" class="col-xs-4 col-form-label">Location Name</label>
                                <div class="col-xs-8">
                                    <input class="form-control" type="text" value="" id="locname" name="lname" [formControl]="complexForm.controls['firstName']">
                                </div>
                            </div>
                            <div class="form-group row">
                                <label for="locid" class="col-xs-4 col-form-label">Location ID</label>
                                <div class="col-xs-8">
                                    <input class="form-control" type="search" id="locid" name="lid">
                                </div>
                            </div>
                            <div class="form-group row">
                                <label for="locexp" class="col-xs-4 col-form-label">Location Exposure</label>
                                <div class="col-xs-8">
                                    <input class="form-control" type="search" value="" id="locexp" name="lexp">
                                </div>
                            </div>
                            <div class="form-group row">
                                <label for="locoe" class="col-xs-4 col-form-label">Location OE</label>
                                <div class="col-xs-8">
                                    <input class="form-control" type="search" value="" id="locoe" name="loe">
                                </div>
                            </div>
                            <div class="form-group row">
                                <label for="locrisc" class="col-xs-4 col-form-label">Location Risk Score</label>
                                <div class="col-xs-8">
                                    <input class="form-control" type="search" value="" id="locrisc" name="lrisc">
                                </div>
                            </div>
                            <div class="form-group row">
                                <label for="loclat" class="col-xs-2 col-form-label">Latitude</label>
                                <div class="col-xs-4">
                                    <input type="search" class="form-control" id="loclat" name="llat">
                                </div>

                                <label for="loclon" class="col-xs-2 col-form-label">Longitude</label>
                                <div class="col-xs-4">
                                    <input type="search" class="form-control" id="loclon" name="llon">
                                </div>
                            </div>
                            <div class="form-group row">
                                <div class="col-xs-1">
                                    <input type="hidden" class="form-control" id="lochidden" name="lhidden">
                                </div>

                            </div>

                            <button type="button" class="btn btn-primary" id="saveloc" (click)="SaveData()">Save</button>
                            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>

                        </form>
                    </div>

                </div>
            </div>

        </div>
    </div>
  `
})
export class FormValidationComponent {
  complexForm : FormGroup;

  constructor(fb: FormBuilder){
    this.complexForm = fb.group({
      'firstName' : [null, Validators.required],
      'lastName': [null,  Validators.compose([Validators.required, Validators.minLength(5), Validators.maxLength(10)])],
      'gender' : [null, Validators.required],
      'hiking' : [false],
      'running' : [false],
      'swimming' : [false]
    })
    console.log(this.complexForm);
    this.complexForm.valueChanges.subscribe( (form: any) => {
      console.log('form changed to:', form);
    }
    );
  }

  submitForm(value: any){
    console.log(value);
  }
}
