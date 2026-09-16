// Entry point, loaded by widget.html as <script type="module">.
import { initAuth } from "./widgetAuth.js";
import { initRecordView } from "./widgetRecord.js";
import { initSync } from "./widgetSync.js";

initAuth();
initRecordView();
initSync();