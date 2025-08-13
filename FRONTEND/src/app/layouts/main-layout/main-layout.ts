import { Component } from '@angular/core';
import { Aside } from "../../components/compartido/aside/aside";
import { Header } from "../../components/compartido/header/header";
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-main-layout',
  imports: [Aside, Header, RouterModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout {

}
