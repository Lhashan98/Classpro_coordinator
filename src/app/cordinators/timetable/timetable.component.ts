import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Router, ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { count } from 'rxjs';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.css']
})
export class TimetableComponent implements OnInit {
  reportdata: any[] = [];
  ReportArray: any[] = [];
  filteredData: any[] = [];
  batchOptions: string[] = [];
  selectedBatch: string = '';
  buildingOptions: string[] = [];
  selectedBuilding: string = '';
  selectedDay!: string;
  public department: string = "";
  dayOptions: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  @ViewChild('tableToExport') tableToExport!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private cookieService: CookieService
  ) {}

  ngOnInit(): void {
    this.department = this.cookieService.get('department');
    this.route.params.subscribe(params => {
      this.department = params['department'] || this.department;
    });
    this.getAllReporDetails();
  }

  getAllReporDetails(): void {
    const department = this.cookieService.get('department');
   
    if (department) {
      this.http.get<any>(`http://5.181.217.67:8002/addreport/getAll?department=${department}`)
        .subscribe(
          (resultData: any) => {
            this.ReportArray = resultData.data || [];
            this.selectedDay = '';
            this.populateBatchOptions();
            this.populateBuildingOptions();
            this.filterDataByDepartment();
          },
          (error: any) => {
            console.error('Error fetching report data:', error);
          }
        );
    }
  }
  populateBatchOptions(): void {
    const department = this.cookieService.get('department');
    this.batchOptions = [...new Set(this.ReportArray
      .filter(item => item.department === department)
      .map(item => item.batch)
    )];
  }
  

  populateBuildingOptions(): void {
    const department = this.cookieService.get('department');
    this.buildingOptions = [...new Set(this.ReportArray
      .filter(item => item.department === department)
      .map(item => item.nameofbuilding))];
  }

  filterByBatch(): void {
    if (this.selectedBatch) {
      this.filteredData = this.ReportArray.filter(item => item.batch === this.selectedBatch && item.department === this.cookieService.get('department'));
    } else {
      this.filterDataByDepartment();
    }
  }

  filterByBuilding(): void {
    if (this.selectedBuilding) {
      this.filteredData = this.ReportArray.filter(item => item.batch === this.selectedBatch && item.department === this.cookieService.get('department'));
    } else {
      this.filterDataByDepartment();
    }
  }

  filterDataByDepartment(): void {
    const userDepartment = this.cookieService.get('department');
    if (userDepartment) {
      this.filteredData = this.ReportArray.filter(entry => entry.department === userDepartment);
    } else {
      this.filteredData = [];
    }
  }

  getDayType(date: string): string {
    const dayOfWeek = new Date(date).getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[dayOfWeek];
  }

filterByDay(): void {
  if (this.selectedDay) {
    this.filteredData = this.ReportArray.filter(item => 
      this.getDayType(item.requestdate) === this.selectedDay &&
      item.department === this.cookieService.get('department')
    );
  } else {
    this.filterDataByDepartment();
  }
}

  logout() {
    // Clear cookies and navigate to the login page
    this.cookieService.delete('department');
    this.router.navigate(['/login']); // Replace '/login' with the path to your login page
  }



downloadAsPDF(): void {
    const doc = new jsPDF();
    const table = this.tableToExport.nativeElement;
    
    // Extract dates from table data
    const dates = this.filteredData.map(item => item.requestdate);
    const firstDate = new Date(Math.min.apply(null, dates.map(date => new Date(date).getTime())));
    const lastDate = new Date(Math.max.apply(null, dates.map(date => new Date(date).getTime())));
    
    // Format dates
    const formattedFirstDate = `${firstDate.getDate()}.${firstDate.getMonth() + 1}.${firstDate.getFullYear()}`;
    const formattedLastDate = `${lastDate.getDate()}.${lastDate.getMonth() + 1}.${lastDate.getFullYear()}`;
    
    // Add title
    doc.setFontSize(16);
    const title = 'Timetable';
    doc.text(title, 105, 20, { align: 'center' });

    // Add date range below the title with smaller font size
    doc.setFontSize(12);
    const dateRange = `${formattedFirstDate} to ${formattedLastDate}`;
    doc.text(dateRange, 105, 30, { align: 'center' });


    html2canvas(table).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pageWidth = 210; // Width of A4 in mm
      const pageHeight = 295; // Height of A4 in mm
      const marginPx = 95; // Margin in px (100px on all sides)
      const marginMm = marginPx / 3.83465; // Convert px to mm

      // Calculate image dimensions with margins
      const imgWidth = pageWidth - 2 * marginMm;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = marginMm + 10; // Position below title

      doc.addImage(imgData, 'PNG', marginMm, position, imgWidth, imgHeight);

      heightLeft -= pageHeight - 2 * marginMm;

      while (heightLeft > 0) {
        doc.addPage();
        position = marginMm + 10; // Position below title

        doc.addImage(imgData, 'PNG', marginMm, position - imgHeight, imgWidth, imgHeight);
        heightLeft -= pageHeight - 2 * marginMm;
      }

      // Save file with dates in the name
      const filename = `timetable ${formattedFirstDate} to ${formattedLastDate}.pdf`;
      doc.save(filename);
    });
}

}

