import { Routes } from '@angular/router';
import { LoginComponent } from './login-component/login-component';
import { authGuard } from './guards/auth-guard';
import { HomeComponent } from './home-component/home-component';
import { RegisterComponent } from './register-component/register-component';
import { DashboardComponent } from './dashboard-component/dashboard-component';
export const routes: Routes = [
    {path: 'Login', component: LoginComponent},
    {path: 'Register', component: RegisterComponent},
    {path: 'Dashboard', component:DashboardComponent,canActivate: [authGuard]},
    {path: '', component:DashboardComponent,canActivate: [authGuard]},
   {path: 'Agent', component: HomeComponent,canActivate: [authGuard]},
    

];
