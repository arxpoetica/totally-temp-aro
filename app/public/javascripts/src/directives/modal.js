app.directive('modal', function () {
    return {
        template: '<div class="modal fade bs-example-modal-lg" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true"><div class="modal-dialog modal-md"><div class="modal-content" ng-transclude><div class="modal-header"><h4 class="modal-title" id="myModalLabel">Modal title</h4></div></div></div></div>',
        restrict: 'E',
        transclude: true,
        replace: true,
        scope: { visible: '=' },
        link: function postLink(scope, element, attrs) {

            $(element).modal({
                show: false,
                keyboard: attrs.keyboard,
                backdrop: attrs.backdrop
            });

            scope.$watch(function () { return scope.visible; }, function (value) {

                if (value == true) {
                    $(element).modal('show');
                } else {
                    $(element).modal('hide');
                }
            });
        }
    };
}
);

app.directive('modalHeader', function () {
    return {
        template: '<div class="modal-header"><h4 class="modal-title">{{title}}</h4></div>',
        replace: true,
        restrict: 'E',
        scope: { title: '@' }
    };
});

app.directive('modalBody', function () {
    return {
        template: '<div class="modal-body" ng-transclude></div>',
        replace: true,
        restrict: 'E',
        transclude: true
    };
});

app.directive('modalFooter', function () {
    return {
        template: '<div class="modal-footer" ng-transclude></div>',
        replace: true,
        restrict: 'E',
        transclude: true
    };
});