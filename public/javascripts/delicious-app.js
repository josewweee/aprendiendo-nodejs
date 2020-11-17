import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autoComplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map';
import ajaxHeart from './modules/heart';
//Ese $(#) es un document.querySelectorId, pero con bling nos ahorramos esa sintaxis
autoComplete($('#address'), $('#lat'), $('#lng'));

typeAhead($('.search'));
makeMap($('#map'));
const heartForms = $$('form.heart');
// on es -> addEventlISTENER
heartForms.on('submit', ajaxHeart);
