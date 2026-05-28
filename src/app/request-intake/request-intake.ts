import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-request-intake',
  imports: [FormsModule, RouterLink],
  templateUrl: './request-intake.html',
  styleUrl: './request-intake.scss',
})
export class RequestIntake {
  protected referenceNumber = '';

  protected readonly destinationFields = [
    'Owner:',
    'Building:',
    'Floor:',
    'Office: (white sticker on the door)',
    'Region:',
    'Contact:',
  ];

  protected readonly currentLocation = [
    { label: 'Owner:', value: 'IS STOREROOM' },
    { label: 'Building:', value: 'CGO' },
    { label: 'Floor:', value: '4TH' },
    { label: 'Office: (white sticker on the door)', value: '441' },
    { label: 'Region:', value: 'HEAD OFFICE' },
    { label: 'Contact:', value: '012 406 1724' },
  ];
}
