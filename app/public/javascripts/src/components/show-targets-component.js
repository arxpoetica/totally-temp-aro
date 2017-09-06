app.component('showTargets', {
    template: `
    <style scoped>
        #show-targets{
            max-height: 75px;
            overflow: hidden;
        }   
        #show-targets:hover {
            overflow: auto;
        } 
    </style>
    <div id="show-targets">
        <div class="label label-default" style="float:left;margin-right: 5px;margin-top: 1px;" ng-repeat="target in $ctrl.targets">{{ target.address || target.name }}</div>
    </div>    
    `,
    bindings: {
        targets: '='
    }
});