/**
 *    Copyright 2016 Sven Loesekann

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CompanySiteService } from '../services/company-site.service';
import 'bingmaps';
import { ConfigurationService } from '../services/configuration.service';
import { MainConfiguration } from '../model/main-configuration';
import { Observable, of, iif, Subject, forkJoin, Subscription } from 'rxjs';
import { CompanySite } from '../model/company-site';
import { FormBuilder } from '@angular/forms';
import { switchMap, debounceTime, flatMap, tap, map, filter } from 'rxjs/operators';
import { BingMapsService } from '../services/bing-maps.service';

interface Container {
	companySite: CompanySite;
	mainConfiguration: MainConfiguration;
}

@Component({
	selector: 'app-company-site',
	templateUrl: './company-site.component.html',
	styleUrls: ['./company-site.component.scss']
})
export class CompanySiteComponent implements OnInit, AfterViewInit, OnDestroy {
	private mainConfiguration: MainConfiguration = null;
	private readonly COMPANY_SITE = 'companySite';
	private readonly SLIDER_YEAR = 'sliderYear';
	private readonly containerInitSubject = new Subject<Container>();
	private containerInitSubjectSubscription: Subscription;
	private companySiteSubscription: Subscription;
	private sliderYearSubscription: Subscription;
	map: Microsoft.Maps.Map = null;

	companySiteOptions: Observable<CompanySite[]>;
	componentForm = this.formBuilder.group({
		companySite: ['Finkenwerder'],
		sliderYear: [2020],
	});

	@ViewChild('bingMap')
	bingMapContainer: ElementRef;

	constructor(private formBuilder: FormBuilder, private bingMapsService: BingMapsService, private companySiteService: CompanySiteService, private configurationService: ConfigurationService) { }

	ngOnDestroy(): void {
		this.containerInitSubject.complete();
		this.containerInitSubjectSubscription.unsubscribe();
		this.companySiteSubscription.unsubscribe();
		this.sliderYearSubscription.unsubscribe();
	}

	ngOnInit(): void {
		this.companySiteOptions = this.componentForm.valueChanges.pipe(
			debounceTime(300),
			switchMap(() =>
				iif(() => (!this.getCompanySiteTitle() || this.getCompanySiteTitle().length < 3 || !this.componentForm.get(this.SLIDER_YEAR).value),
					of<CompanySite[]>([]),
					this.companySiteService.findByTitleAndYear(this.getCompanySiteTitle(), this.componentForm.get(this.SLIDER_YEAR).value))
			));
		this.companySiteSubscription = this.componentForm.controls[this.COMPANY_SITE].valueChanges
			.pipe(debounceTime(500), 
				filter(companySite => typeof companySite === 'string'), 
				switchMap(companySite => this.companySiteService.findByTitleAndYear((companySite as CompanySite).title, this.componentForm.controls[this.SLIDER_YEAR].value as number)), 
				filter(companySite => companySite?.length && companySite?.length > 0)).subscribe(companySite => this.updateMap(companySite[0]));
		this.sliderYearSubscription = this.componentForm.controls[this.SLIDER_YEAR].valueChanges
			.pipe(debounceTime(500), 
				filter(year => typeof this.componentForm.get(this.COMPANY_SITE).value === 'string'), 
				switchMap(year => this.companySiteService.findByTitleAndYear(this.getCompanySiteTitle(), year as number)), 
				filter(companySite => companySite?.length && companySite?.length > 0)).subscribe(companySite => this.updateMap(companySite[0]));
		forkJoin(this.configurationService.importConfiguration(), this.companySiteService.findByTitleAndYear(this.getCompanySiteTitle(), this.componentForm.controls[this.SLIDER_YEAR].value)).subscribe(values => {
			this.mainConfiguration = values[0];
			this.containerInitSubject.next({ companySite: values[1][0], mainConfiguration: values[0] } as Container);
		});
	}

	ngAfterViewInit(): void {
		this.containerInitSubjectSubscription = this.containerInitSubject
			.pipe(filter(container => !!container && !!container.companySite && !!container.mainConfiguration), flatMap(container => this.bingMapsService.initialize(container.mainConfiguration.mapKey).pipe(flatMap(() => of(container)))))
			.subscribe(container => {
				this.map = new Microsoft.Maps.Map(this.bingMapContainer.nativeElement as HTMLElement, {
					center: new Microsoft.Maps.Location(container.companySite.polygons[0].centerLocation.latitude, container.companySite.polygons[0].centerLocation.longitude),
				} as Microsoft.Maps.IMapLoadOptions);
				//console.log(this.map.getCenter());
				const ringLocations = container.companySite.polygons[0].rings[0].locations.map(myLocation => new Microsoft.Maps.Location(myLocation.latitude, myLocation.longitude));
				const polygon = new Microsoft.Maps.Polygon(ringLocations);
				this.map.entities.push(polygon);
			});
	}

	private updateMap(companySite: CompanySite) {
		if (this.map) {
			this.map.setOptions({
				center: new Microsoft.Maps.Location(companySite.polygons[0].centerLocation.latitude, companySite.polygons[0].centerLocation.longitude),
			} as Microsoft.Maps.IMapLoadOptions);
			const ringLocations = companySite.polygons[0].rings[0].locations.map(myLocation => new Microsoft.Maps.Location(myLocation.latitude, myLocation.longitude));
			const polygon = new Microsoft.Maps.Polygon(ringLocations);
			this.map.entities.clear();
			this.map.entities.push(polygon);
		}
	}

	private getCompanySiteTitle(): string {
		return typeof this.componentForm.get(this.COMPANY_SITE).value === 'string' ? this.componentForm.get(this.COMPANY_SITE).value as string : (this.componentForm.get(this.COMPANY_SITE).value as CompanySite).title;
	}

	formatLabel(value: number): string {
		return '' + value;
	}

	displayTitle(companySite: CompanySite): string {
		return companySite && companySite.title ? companySite.title : '';
	}
}
