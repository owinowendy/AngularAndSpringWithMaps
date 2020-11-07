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
import { Component, OnInit } from '@angular/core';
import { CompanySiteService } from '../services/company-site.service';
import * as BingMaps from 'bing-maps';
import { ConfigurationService } from '../services/configuration.service';
import { MainConfiguration } from '../model/main-configuration';


@Component({
  selector: 'app-company-site',
  templateUrl: './company-site.component.html',
  styleUrls: ['./company-site.component.scss']
})
export class CompanySiteComponent implements OnInit {
  private mainConfiguration: MainConfiguration = null;

  constructor(private companySiteService: CompanySiteService, private configurationService: ConfigurationService) { }

  ngOnInit(): void {
	
  }

}
