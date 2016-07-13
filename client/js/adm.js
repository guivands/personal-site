//var app=angular.module('ngDirTree',['g2-tree','summernote']);
app.requires.push('g2-tree');
app.requires.push('summernote');
app.controller('dirTreeCtrl',function($scope,$http,$interval){
	$scope.simpleToolbar=[
		['style',['bold','italic','underline','clear']],
		['fontsize', ['fontsize']],
		['para', ['ul', 'ol', 'paragraph']],
		['style',['style']],
		['height', ['height']],
		['ext',['link','picture','video']],
		['highlight',['highlight']],
		['misc',['codeview','fullscreen']],
		['help',['help']]
	];
	$scope.completeToolbar=[
		['err',['undo','redo']],
		['text',['bold','italic','underline','strikethrough','superscript','subscript','clear']],
		['font', ['fontname','fontsize','color']],
		['style',['style']],
		['height', ['height']],
		['para', ['ul', 'ol', 'paragraph']],
		['insert',['table','hr']],
		['ext',['link','picture','video']],
		['highlight',['highlight']],
		['misc',['codeview','fullscreen']],
		['help',['help']]
	];
	$scope.options = {
		focus:true,
		toolbar:$scope.completeToolbar
	};
	$scope.post ={};
	
	
	
	$scope.notifications=[];
	$scope.selectedNode=false;
	$scope.addRemoveArray=false;
	$scope.tempNode;
	$scope.myTree=[];
	$scope.parentDir = $scope.dirName = $scope.uniqueName = '';
	$scope.locale='pt';
	$scope.errMsgs=[];
	$scope.dirContent = {directories:[],posts:[]};
	$scope.selectNode=function(node){
		$scope.selectedNode = node;
		$scope.childrenDirs = node.children;
		$scope.redoChildren();
		$scope.postDir = $scope.parentDir = node.name;
		$scope.showPost(false);
	};
	$scope.setPath=function(p){
		if(p=='post')
			$scope.postPath = angular.lowercase(removeDiacritics($scope.postTitle)).replace(/(\s|[^a-z0-9_.])+/g,'-');
		else
			$scope.path = angular.lowercase(removeDiacritics($scope.dirName)).replace(/(\s|[^a-z0-9_.])+/g,'-');
		$scope.setFullPath(p);
	};
	$scope.setFullPath=function(p){
		if(p=='post')
			$scope.postFullpath = ($scope.selectedNode ? $scope.selectedNode.fullpath + '/' : '') + $scope.postPath;
		else
			$scope.fullpath = ($scope.selectedNode ? $scope.selectedNode.fullpath + '/' : '') + $scope.path;
	};
	$scope.addNode=function(){
		var uri = "addTreeNode?name="+$scope.dirName+"&uniqueName="+$scope.uniqueName+"&locale="+$scope.locale+"&path="+$scope.path+"&fullpath="+$scope.fullpath;
		if($scope.selectedNode)uri+="&parentId="+$scope.selectedNode.id;
		$http({
			method:'POST',
			url:uri,
			headers: { 'X-Requested-With' :'XMLHttpRequest'}
		}).then(
			function(res){//success
				if (res.data.error) {
					$scope.errMsgs=res.data.messages;
					return;
				}
				if (res.data.g2Error && res.data.code == 'DIR_UNIQUE_NAME_DUPLICATE') {
					$scope.errMsgs = ['Nome &Uacute;nico j&aacute; est&aacute; sendo utilizado'];
					return;
				}
				$scope.redoChildren();
				$scope.myTree=res.data;
				$('#createNode').modal('hide');
				$scope.dirName='';
				$scope.uniqueName='';
				$scope.locale='pt';
				$scope.errMsgs = [];
			},
			function(res){//error
				console.log("error adding",res.data);
				$scope.errMsgs = ['Um erro inesperado aconteceu'];
			}
		);
	};
	$scope.removeNode=function(node){
		$scope.addRemoveArray=node;

		if (!confirm('Remover ' + node.id + ':' + node.name + '?')) {
			return;
		}

		var uri = "removeTreeNode?did="+node.id+'&locale='+$scope.dirTreeLocale;
		$http({
			method:'POST',
			url:uri,
			headers: { 'X-Requested-With' :'XMLHttpRequest'}
		}).then(
			function(res){//success
				if (res.data.error) {
					var msg = '';
					for (var i in res.data.messages) {
						msg += res.data.messages[i] + '\n';
					}
					alert(msg);
					return;
				}
				$scope.redoChildren();
				$scope.myTree=res.data;
			},
			function(res){//error
				alert('Um erro inesperado aconteceu');
			}
		);
	};
	$scope.openModal=function(children,node){
		$scope.addRemoveArray=children;
		$scope.tempNode=node;
		$scope.dirName='';
		$('#createNode').modal('show');
	};
	$scope.redoTree = function() {
		$scope.dirContent = {directories:[],posts:[]};
		$scope.myTree = [];
		$scope.selectedNode=false;
		if ($scope.dirTreeLocale) {
			$scope.redoChildren();
			$http({
			  method:'GET',
			  url:'/fullDirectoryTree?locale='+$scope.dirTreeLocale
			}).then(function(res){
				$scope.myTree = res.data;
			  },
			  function(res){console.log('error',res);}
			);
		}
	};
	$scope.redoChildren = function() {
		$scope.dirContent = {directories:[],posts:[]};
		if ($scope.dirTreeLocale) {
			var uri = '/dirContent?locale='+$scope.dirTreeLocale;
			if($scope.selectedNode) uri+='&dirId='+$scope.selectedNode.id;
			$http({
				method:'GET',
				url:uri
			}).then(function(res){
				if(res.data.g2error) {
					return console.log('error', res.data);
				}
				$scope.dirContent=res.data;
			},function(res){
				console.log('error',res);
			});
		}
	};

	$('#createNode').on('shown.bs.modal',function(){$('#dirName').focus()});

	$http({
		method:'POST',
		url:'/dirAvailableLocales',
		headers: { 'X-Requested-With' :'XMLHttpRequest'}
	}).then(
		function(res){//success
			if (res.data.error) {
				alert(res.data.messages);
				return;
			}
			$scope.dirTreeLocales = res.data;
			$scope.dirTreeLocale = $scope.dirTreeLocales[0];
			$scope.redoTree();
		},
		function(res){//error
			console.log("error adding",res.data);
			alert('Um erro inesperado aconteceu');
		}
	);
	
	
	
	
	$scope.newPost = function() {
		$scope.postUniqueName=$scope.postTitle=$scope.postDescription=$scope.postTags=$scope.postPath=$scope.postFullpath=$scope.postLocale=$scope.post=$scope.postId='';
		$scope.postFullpath=$scope.selectedNode.fullpath;
		$scope.showPost(true);
		$scope.isNewPost=true;
	};
	$scope.showPost = function(s) {
		$('#postForm').css('display',s?'block':'none');
	};
	$scope.mergePost = function() {
		console.log($scope.postFullpath);
		var pdata = {
			uniqueName:$scope.postUniqueName,
			title:$scope.postTitle,
			description:$scope.postDescription,
			tags:$scope.postTags,
			directoryId:$scope.selectedNode.id,
			path:$scope.postPath,
			fullpath:$scope.postFullpath,
			locale:$scope.postLocale,
			post:$scope.post,
			id:$scope.postId
		};
		console.log(pdata);
		$http({
			method:'POST',
			url:'/mergePost',
			headers: { 'X-Requested-With' :'XMLHttpRequest'},
			data:pdata
		}).then(
			function(res){//success
				if (res.data.error) {
					console.log(res.data);
					$scope.notifications=[];
					for(msg in res.data.messages){
						$scope.notifications.push({type:'danger',msg:res.data.messages[msg]});
					}
					return;
				}
				if (res.data.g2Error && res.data.code == 'POST_UNIQUE_NAME_DUPLICATE') {
					$scope.notifications = [{type:'danger',msg:'Nome único já está sendo utilizado'}];
					return;
				}
				if (res.data.g2Error && res.data.code == 'POST_TITLE_DUPLICATE') {
					$scope.notifications = [{type:'danger',msg:'Título já está sendo utilizado'}];
					return;
				}
				if (res.data.g2Error && res.data.code == 'POST_PATH_DUPLICATE') {
					$scope.notifications = [{type:'danger',msg:'Caminho já está sendo utilizado'}];
					return;
				}
				$scope.notifications=[{type:'success',msg:'Post salvo com sucesso!'}];
			},
			function(res){//error
				console.log("error adding",res.data);
				$scope.notifications = [{type:'danger',msg:'Um erro inesperado aconteceu'}];
			}
		);
	};
		
	$scope.loadPost = function(pid){
		$http({
			method:'POST',
			url:'/findPostById?id='+pid,
			headers: { 'X-Requested-With' :'XMLHttpRequest'}
		}).then(
			function(res){//success
				if (res.data.error) {
					console.log(res.data);
					$scope.errMsgs=res.data.messages;
					return;
				}
				if (res.data.g2Error && res.data.code == 'DIR_UNIQUE_NAME_DUPLICATE') {
					$scope.errMsgs = ['Nome único já está sendo utilizado'];
					return;
				}
				$scope.postUniqueName=res.data.uniqueName;
				$scope.postTitle=res.data.title;
				$scope.postDescription=res.data.description;
				$scope.postTags=res.data.tags;
				$scope.postPath=res.data.path;
				$scope.postFullpath=res.data.fullpath;
				$scope.postLocale=res.data.locale;
				$scope.post=res.data.post;
				$scope.postId=res.data.id;
				$scope.showPost(true);
				$scope.isNewPost=false;
			},
			function(res){//error
				console.log("error adding",res.data);
				$scope.errMsgs = ['Um erro inesperado aconteceu'];
			}
		);
	};
});
