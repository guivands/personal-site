'use strict';

angular.module('g2-tree', []).directive('g2Tree',function(){
	return {
		restrict:'E',
		scope:{
			tree:'=',
			onSelect:'&',
			onAddNode:'&',
			onRemoveNode:'&'
		},
		template:"<div><g2-tree-node ng-repeat=\"node in tree\" node=\"node\" add-button=\"onAddNode\" remove-button=\"onRemoveNode\"><\/g2-tree-node><button type=\"button\" class=\"btn btn-default btn-xs glyphicon glyphicon-plus\" ng-if=\"onAddNode()\" ng-click=\"addNode(this,tree);\"> <\/button><\/div>",
		controller:function($scope){
			$scope.unselAll=function(all){
				for(i in all){
					all[i].selected=false;
					if(all[i].children){$scope.unselAll(all[i].children);}
				}
			}
			$scope.addNode=function(e,data){
				var onAddNode=$scope.onAddNode();
				if(onAddNode){
					if(data.name) {
						if(!data.children) data.children=[];
						onAddNode(data.children,data);
						data.showChildren=true;
					} else {
						onAddNode(data,null);
					}
				}
			}
			$scope.removeNode=function(e,data){
				var onRemoveNode=$scope.onRemoveNode();
				if(onRemoveNode){
					onRemoveNode(data);
				}
			};
		
			$scope.$on('selectNode',function(e,data){
				var onSelectCallback=$scope.onSelect();
				onSelectCallback(data);
				$scope.unselAll($scope.tree);
				data.selected=true;
			});
			$scope.$on('addTreeNode',$scope.addNode);
			$scope.$on('removeTreeNode',$scope.removeNode);
		}
	};
}).directive('g2TreeNode',function($compile){
	return {
		restrict:'E',
		scope:{
			node:'=',
			addButton:'=',
			removeButton:'='
		},
		template:"<div class=\"g2-tree-node\"><div><span class=\"g2-folder glyphicon\" ng-class=\"{'glyphicon-folder-open':!hasChildren(node)||node.showChildren,'glyphicon-folder-close':hasChildren(node)}\" ng-click=\"ocFolder(node);\"><\/span><span ng-class=\"{'g2-selected-node':node.selected}\" ng-click=\"selectNode(node);\">{{node.name}}<\/span><button type=\"button\" class=\"btn btn-default btn-xs glyphicon glyphicon-plus\" ng-if=\"addButton()\" ng-click=\"addNodeBtnPressed(node);\"> <\/button><button type=\"button\" class=\"btn btn-default btn-xs glyphicon glyphicon-minus\" ng-if=\"removeButton()\" ng-click=\"removeNodeBtnPressed(node);\"> <\/button><\/div><\/div><div class=\"g2-children\" ng-if=\"node.children\" ng-hide=\"!node.showChildren\"><g2-tree-node ng-repeat=\"child in node.children\" node=\"child\" add-button=\"addButton\" remove-button=\"removeButton\"><\/g2-tree-node><\/div>",
		controller:function($scope) {
			$scope.selectNode=function(node) {
				$scope.$emit('selectNode', node);
			}
			$scope.addNodeBtnPressed=function(node){
				$scope.$emit('addTreeNode',node);
			}
			$scope.removeNodeBtnPressed=function(node){
				$scope.$emit('removeTreeNode',node);
			}
			$scope.ocFolder=function(node){
				node.showChildren=!node.showChildren;
			};
			$scope.hasChildren=function(node){
				return node.children && node.children.length > 0;
			}
		},
		compile:function(element){
			var contents=element.contents().remove();
			var compiledContents;
			return function(scope,iElement){
				if(!compiledContents) {
					compiledContents = $compile(contents);
				}
				compiledContents(scope,function(clone){
					iElement.append(clone);
				});
			}
		}
	};
});
