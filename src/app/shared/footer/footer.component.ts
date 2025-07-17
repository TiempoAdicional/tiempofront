import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    FormsModule
  ],

  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {
  @ViewChild('footerElement', { static: true }) footerElement!: ElementRef;

  activeSection: string | null = null;
  isVisible = false;
  showBackToTop = false;
  emailInput = '';
  constructor(private router: Router) { }
  private observer!: IntersectionObserver;
  private scrollListener!: () => void;

  ngOnInit(): void {
    this.setupIntersectionObserver();
    this.setupScrollListener();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.isVisible = true;
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    this.observer.observe(this.footerElement.nativeElement);
  }

  private setupScrollListener(): void {
    this.scrollListener = () => {
      this.showBackToTop = window.pageYOffset > 300;
    };
    window.addEventListener('scroll', this.scrollListener);
  }

  toggleSection(section: string): void {
    this.activeSection = this.activeSection === section ? null : section;
  }

  onSocialClick(platform: string, event: Event): void {
    event.preventDefault();
    window.open(this.getSocialUrl(platform), '_blank');
  }

  getSocialUrl(platform: string): string {
    switch (platform) {
      case 'instagram': return 'https://instagram.com/tiempoadicional';
      case 'tiktok': return 'https://tiktok.com/@tiempoadicional';
      case 'whatsapp': return 'https://wa.me/573001234567';
      default: return '#';
    }
  }

  onFooterLinkClick(link: string, event: Event): void {
    event.preventDefault();
    console.log(`Footer link clicked: ${link}`);
  }

  onContactClick(type: string): void {
    switch (type) {
      case 'email':
        window.location.href = 'mailto:gerencia@tiempoadicional.com';
        break;
      case 'phone':
        window.location.href = 'tel:+573158966668';
        break;
      case 'address':
        window.open('https://maps.google.com/?q=Colombia', '_blank');
        break;
    }
  }

  onNewsletterSubmit(): void {
    if (this.emailInput && this.emailInput.includes('@')) {
      console.log(`Subscribed with email: ${this.emailInput}`);
      this.emailInput = '';
    }
  }

  onBottomLinkClick(link: string, event: Event): void {
    event.preventDefault();
    if (link === 'politicas') {
      this.router.navigate(['/politicas']);
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
