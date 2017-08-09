import {
  ApplicationRef,
  Component,
  ComponentFactoryResolver,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  OnDestroy,
  Output,
  ViewContainerRef,
} from '@angular/core';
import {Http} from '@angular/http';
import {ComponentPortal, DomPortalHost} from '@angular/material';
import {ExampleViewer} from '../example-viewer/example-viewer';
import {HeaderLink} from './header-link';

@Component({
  selector: 'doc-viewer',
  template: 'Loading document...',
})
export class DocViewer implements OnDestroy {
  private _portalHosts: DomPortalHost[] = [];

  /** The URL of the document to display. */
  @Input()
  set documentUrl(url: string) {
    this._fetchDocument(url);
  }

  @Output() contentLoaded = new EventEmitter<void>();

  constructor(private _appRef: ApplicationRef,
              private _componentFactoryResolver: ComponentFactoryResolver,
              private _elementRef: ElementRef,
              private _http: Http,
              private _injector: Injector,
              private _viewContainerRef: ViewContainerRef) {}

  /** Fetch a document by URL. */
  private _fetchDocument(url: string) {
    this._http.get(url).subscribe(
        response => {
          // TODO(mmalerba): Trust HTML.
          if (response.ok) {
            this._elementRef.nativeElement.innerHTML = response.text();
            this._loadComponents('material-docs-example', ExampleViewer);
            this._loadComponents('header-link', HeaderLink);
            this.contentLoaded.next();
          } else {
            this._elementRef.nativeElement.innerText =
              `Failed to load document: ${url}. Error: ${response.status}`;
          }
        },
        error => {
          this._elementRef.nativeElement.innerText =
              `Failed to load document: ${url}. Error: ${error}`;
        });
  }

  /** Instantiate a ExampleViewer for each example. */
  private _loadComponents(componentName: string, componentClass: any) {
    let exampleElements =
        this._elementRef.nativeElement.querySelectorAll(`[${componentName}]`);

    Array.prototype.slice.call(exampleElements).forEach((element: Element) => {
      let example = element.getAttribute(componentName);

      let exampleContainer = document.createElement('div');
      element.appendChild(exampleContainer);

      let portalHost = new DomPortalHost(
          exampleContainer, this._componentFactoryResolver, this._appRef, this._injector);
      let examplePortal = new ComponentPortal(componentClass, this._viewContainerRef);
      let exampleViewer = portalHost.attach(examplePortal);
      exampleViewer.instance.example = example;

      this._portalHosts.push(portalHost);
    });
  }

  private _clearLiveExamples() {
    this._portalHosts.forEach(h => h.dispose());
    this._portalHosts = [];
  }

  ngOnDestroy() {
    this._clearLiveExamples();
  }
}
