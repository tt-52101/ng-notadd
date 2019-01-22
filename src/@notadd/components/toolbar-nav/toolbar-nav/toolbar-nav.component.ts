import { Component, OnInit, OnDestroy, ViewChild, ViewContainerRef, Input } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { CdkOverlayOrigin, Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { Portal, TemplatePortalDirective } from '@angular/cdk/portal';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { notaddAnimations } from '@notadd/animations';
import { NotaddNavigationService } from '@notadd/components/navigation/navigation.service';
import { NotaddNavigationItem } from '@notadd/types';

@Component({
    selector: 'notadd-toolbar-nav',
    templateUrl: './toolbar-nav.component.html',
    styleUrls: ['./toolbar-nav.component.scss'],
    animations: notaddAnimations
})
export class NotaddToolbarNavComponent implements OnInit, OnDestroy {

    @ViewChild(CdkOverlayOrigin) overlayOrigin: CdkOverlayOrigin;
    @ViewChild('navPanelTemplate') navPanelTemplate: TemplatePortalDirective;
    overlayRef: OverlayRef;

    @Input()
    navigation: any;

    currentNavItem: NotaddNavigationItem;

    private ngUnsubscribe: Subject<any>;

    constructor(
        private overlay: Overlay,
        private navigationService: NotaddNavigationService,
        private router: Router
    ) {
        this.ngUnsubscribe = new Subject<any>();
    }

    ngOnInit() {
        this.navigation = this.navigation || this.navigationService.getCurrentNavigation();

        // 订阅当前导航的改变
        this.navigationService.onNavigationChanged
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(() => {
                this.navigation = this.navigationService.getCurrentNavigation();
            });

        // 设置当前导航
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => {
                this.navigation.map((item) => {
                    if (event.url.includes(item.id)) {
                        this.currentNavItem = item;
                    }
                });
            });

        const config = new OverlayConfig({
            hasBackdrop: true,
            backdropClass: 'cdk-overlay-transparent-backdrop',
            scrollStrategy: this.overlay.scrollStrategies.block()
        });

        config.positionStrategy = this.overlay
            .position()
            .connectedTo(
                this.overlayOrigin.elementRef,
                { originX: 'start', originY: 'bottom' },
                { overlayX: 'start', overlayY: 'top' }
            );

        this.overlayRef = this.overlay.create(config);

        this.overlayRef.backdropClick().subscribe(() => {
            this.overlayRef.detach();
        });
    }

    showPanel() {
        if (this.overlayRef && this.overlayRef.hasAttached()) {
            this.overlayRef.detach();
        } else {
            this.overlayRef.attach(this.navPanelTemplate);
        }
    }

    selectNav(item: NotaddNavigationItem) {
        this.currentNavItem = item;
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}