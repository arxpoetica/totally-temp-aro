The accordion component can be used in the following way:

<!-- Incude both the accordion-component.js and accordion-panel-component.js in your HTML file -->

<!-- First declare a parent div (or any other element) that will contain the accordion -->
<div style="position: absolute; background-color: blue; left: 200px; top: 200px; width: 400px; height: 400px">

  <!-- Then declare the accordion controller -->
  <accordion>

    <!-- Then declare the accordion panels with whatever custom content you want -->
    <accordion-panel title="'Title1'">  <!-- Note the title is sent as a string, so "'Title1'", not "Title1" -->
      Custom content<br>
      Custom content<br>
      Custom content<br>
      Custom content<br>
      Custom content<br>
    </accordion-panel>
    
    <accordion-panel title="'Title2'">
      More custom content
    </accordion-panel>
  </accordion>
</div>
