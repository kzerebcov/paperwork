import {ComponentFactoryResolver, Directive, OnInit, TemplateRef, ViewContainerRef} from '@angular/core';
import {WrapperContainerComponent} from './wrapper-container.component';

@Directive({
  selector: '[appWrapperContainer]'
})
export class WrapperDirective implements OnInit{

  private wrapperComponentRef;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver
  ) { }

  ngOnInit(): void {
    this.wrapperComponentRef = this.viewContainer.createComponent(
      this.componentFactoryResolver.resolveComponentFactory(WrapperContainerComponent)
    );
    this.wrapperComponentRef.instance.template = this.templateRef;
  }
}
