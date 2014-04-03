define(["mvc/dataset/hda-model","mvc/dataset/hda-base","mvc/history/readonly-history-panel"],function(c,a,b){var d=b.ReadOnlyHistoryPanel.extend({className:"annotated-history-panel",HDAViewClass:a.HDABaseView,renderModel:function(){this.$el.addClass(this.className);var g=b.ReadOnlyHistoryPanel.prototype.renderModel.call(this),e=this.$datasetsList(g),f=$("<table/>").addClass("datasets-list datasets-table");f.append(e.children());e.replaceWith(f);g.find(".history-subtitle").after(this.renderHistoryAnnotation());g.find(".history-search-btn").hide();g.find(".history-controls").after(g.find(".history-search-controls").show());return g},renderHistoryAnnotation:function(){var e=this.model.get("annotation");if(!e){return null}return $(['<div class="history-annotation">',e,"</div>"].join(""))},renderHdas:function(f){f=f||this.$el;var e=b.ReadOnlyHistoryPanel.prototype.renderHdas.call(this,f);this.$datasetsList(f).prepend($("<tr/>").addClass("headers").append([$("<th/>").text(_l("Dataset")),$("<th/>").text(_l("Annotation"))]));return e},attachHdaView:function(h,f){f=f||this.$el;var i=_.find(h.el.classList,function(j){return(/^state\-/).test(j)}),e=h.model.get("annotation")||"",g=$("<tr/>").addClass("dataset-row").append([$("<td/>").addClass("dataset-container").append(h.$el).addClass(i?i.replace("-","-color-"):""),$("<td/>").addClass("additional-info").text(e)]);this.$datasetsList(f).append(g)},events:_.extend(_.clone(b.ReadOnlyHistoryPanel.prototype.events),{"click tr":function(e){$(e.currentTarget).find(".dataset-title-bar").click()},"click .icon-btn":function(e){e.stopPropagation()}}),toString:function(){return"AnnotatedHistoryPanel("+((this.model)?(this.model.get("name")):(""))+")"}});return{AnnotatedHistoryPanel:d}});