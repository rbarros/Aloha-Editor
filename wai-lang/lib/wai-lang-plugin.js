/*!
* Aloha Editor
* Author & Copyright (c) 2011 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed under the terms of http://www.aloha-editor.com/license.html
*/

define(
[
 'aloha/plugin', 
 'aloha/floatingmenu', 
 'i18n!wai-lang/nls/i18n', 
 'i18n!aloha/nls/i18n',
 'wai-lang/languages',
 'css!wai-lang/css/wai-lang.css'
],
function(Plugin, FloatingMenu, i18n, i18nCore) {
	"use strict";
	
	var jQuery = window.alohaQuery || window.jQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha;

	return Plugin.create('wai-lang', {

		/**
		 * Configure the available languages (i18n) for this plugin
		 */
		languages: ['en', 'de'],

		/**
		 * Default configuration allows spans everywhere
		 */
		config: ['span'],

		/**
		 * the defined object types to be used for this instance
		 */
		objectTypeFilter: [],
		
		/**
		 * Initialize the plugin
		 */
		init: function () {
			
			if ( typeof this.settings.objectTypeFilter !== 'undefined') {
				this.objectTypeFilter = this.settings.objectTypeFilter;
			}

			this.createButtons();
			this.subscribeEvents();
			this.bindInteractions();	
		},
		
		/**
		 * Subscribe for events
		 */
		subscribeEvents: function () {
	
			var that = this;
	
			// add the event handler for selection change
			Aloha.bind('aloha-selection-changed', function(event, rangeObject) {
				var config, foundMarkup;

				if (Aloha.activeEditable) {
					// show/hide the button according to the configuration
					config = that.getEditableConfig(Aloha.activeEditable.obj);
					if ( jQuery.inArray('span', config) != -1) {
						that.addMarkupToSelectionButton.show();
					} else {
						that.addMarkupToSelectionButton.hide();
						// leave if a is not allowed
						return;
					}
	
					foundMarkup = that.findLanguageMarkup( rangeObject );
					if ( foundMarkup ) {
						that.addMarkupToSelectionButton.hide();
						FloatingMenu.setScope(that.getUID('wai-lang'));
						that.langField.setTargetObject(foundMarkup, 'lang');
					} else {
						that.langField.setTargetObject(null);
					}
	
					// TODO this should not be necessary here!
					FloatingMenu.doLayout();
				}
	
			});
	
		},
		/**
		 * Initialize the buttons
		 */
		createButtons: function () {
			var that = this;
	
			
			// Button for adding a language markup to the current selection
			this.addMarkupToSelectionButton = new Aloha.ui.Button({
				'iconClass' : 'aloha-button aloha-button-wai-lang',
				'size' : 'small',
				'onclick' : function () { that.addMarkupToSelection( false ); },
				'tooltip' : i18n.t('button.add-wai-lang.tooltip'),
				'toggle' : false
			});
			FloatingMenu.addButton(
				'Aloha.continuoustext',
				this.addMarkupToSelectionButton,
				i18nCore.t('floatingmenu.tab.format'),
				1
			);
	
			// Add the new scope for the wai languages plugin tab
			FloatingMenu.createScope(this.getUID('wai-lang'), 'Aloha.continuoustext'); //'Aloha.continuoustext');
	
			this.langField = new Aloha.ui.AttributeField({
				'width':320,
				'valueField': 'id'
			});
			this.langField.setTemplate('<a><b>{name}</b></p></p><img src="' + Aloha.getPluginUrl('wai-lang') + '/{url}"/></a>');
			this.langField.setObjectTypeFilter(this.objectTypeFilter);
			// add the input field for links
			FloatingMenu.addButton(
				this.getUID('wai-lang'),
				this.langField,
				i18n.t('floatingmenu.tab.wai-lang'),
				1
			);
	
		},
		
		/**
		 * Parse a all editables for elements that have a lang attribute and bind an onclick event
		 */
		bindInteractions: function () {
			var that = this;
	
			// on blur check if lang is empty. If so remove the a tag
			this.langField.addListener('blur', function(obj, event) {
				if ( !this.getValue() ) {
					that.removeMarkup();
				}
			});
			
			Aloha.bind('aloha', that.handleExistingSpans);
	
		},
		
		/**
		 * Find all existing spans and register hotkey hotkeys and make 
		 * annotations of languages visible.
		 */
		handleExistingSpans: function() {
			var that = this;
			// add to all editables the Link shortcut
			jQuery.each(Aloha.editables, function(key, editable){
				
				// Hotkey for adding new language annotations: CTRL+I
				editable.obj.keydown(that.handleKeyDown);			

				
			});
			
			jQuery.each(Aloha.editables, function(key, editable){
				// Find all spans with lang attributes and add some css and event handlers
				editable.obj.find('span[lang]').each(function( i ) {
					that.makeVisible(this);
				});
			});
			
		},
		
		
		handleKeyDown: function(e) {
			if ( e.metaKey && e.which == 73 ) {
				
				if ( that.findLanguageMarkup() ) {
					FloatingMenu.userActivatedTab = i18n.t('floatingmenu.tab.wai-lang');

					// TODO this should not be necessary here!
					FloatingMenu.doLayout();

					that.langField.focus();

				} else {
					that.addMarkupToSelection();
				}
				// prevent from further handling
				// on a MAC Safari cursor would jump to location bar. Use ESC then META+I
				return false;
			}					
		},
		
		/**
		 * Make the given element visible by adding some styles to it.
		 */
		makeVisible: function(element) {
			
			// Make existing spans with language attribute visible
			// Flags can be added via the metaview plugin
			//jQuery(element).css('background-image', 'url('+Aloha.getPluginUrl('wai-lang')+'/img/flags/'+ jQuery(element).attr('lang') + '.png)');
			jQuery(element).addClass('wai-lang');
			
		},
		
		/**
		 * Check whether the range is within a span that contains a lang attribute
		 * @param {GENTICS.Utils.RangeObject} range range where to insert the object (at start or end)
		 * @return markup
		 * @hide
		 */
		findLanguageMarkup: function ( range ) {
	
			if ( typeof range == 'undefined' ) {
				range = Aloha.Selection.getRangeObject();
			}
			if ( Aloha.activeEditable ) {
				return range.findMarkup(function() {
					return this.nodeName.toLowerCase() == 'span';
				}, Aloha.activeEditable.obj);
			} else {
				return null;
			}
		},
		
		/**
		 * Format the current selection or if collapsed the current word as element that should be annotated.
		 */
		formatLanguageSpan: function () {
	
			var range = Aloha.Selection.getRangeObject();
	
			if (Aloha.activeEditable) {
				if ( this.findLanguageMarkup( range ) ) {
					this.removeMarkup();
				} else {
					this.insertMarkup();
				}
			}
		},
		
		
		addMarkupToSelection: function () {
			var range, newSpan;

			// do not add markup to a area that already contains a markup
			if ( this.findLanguageMarkup( range ) ) {
				return;
			}
	
			// activate floating menu tab
			FloatingMenu.userActivatedTab = i18n.t('floatingmenu.tab.wai-lang');
	
			// current selection or cursor position
			range = Aloha.Selection.getRangeObject();
	
			// if selection is collapsed then extend to the word.
			if (range.isCollapsed()) {
				GENTICS.Utils.Dom.extendToWord(range);
			}
			if ( !range.isCollapsed() ) {
				newSpan = jQuery('<span></span>');
				GENTICS.Utils.Dom.addMarkup(range, newSpan, false);
			}
			range.select();
			this.langField.focus();
		},
		
		/**
		 * Remove an a tag.
		 */
		removeMarkup: function () {
	
			var	range = Aloha.Selection.getRangeObject(),
				foundMarkup = this.findLanguageMarkup();
			if ( foundMarkup ) {
				// remove the markup
				GENTICS.Utils.Dom.removeFromDOM(foundMarkup, range, true);
				// set focus back to editable
				Aloha.activeEditable.obj[0].focus();
				// select the (possibly modified) range
				range.select();
			}
		},
		
		/**
		 * Make the given jQuery object (representing an editable) clean for saving
		 * Find all elements with lang attributes and remove the attribute.
		 * @param obj jQuery object to make clean
		 * @return void
		 */
		makeClean: function (obj) {

			// find all lang spans
			obj.find('span[lang]').each(function() {
				//jQuery(this).css({'background-image' : ''})
				jQuery(this).removeClass('wai-lang');
			});
		}
	});
});