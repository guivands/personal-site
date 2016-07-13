module.exports = {
    //Erros globais
    'CONNECTION_ERROR': 'CONNECTION_ERROR', //Erro ao buscar conexão do Pool de Conexões
    
    //Erros de Diretorio
    'DIR_SELECT_ALL': 'DIR_SELECT_ALL', //Erro ao buscar árvore de diretórios
    'DIR_UNIQUE_NAME_DUPLICATE': 'DIR_UNIQUE_NAME_DUPLICATE', //Nome unico duplicado
    'DIR_NUM_UNIQUE_NAME': 'DIR_NUM_UNIQUE_NAME', //Erro na busca de count(*) de unique name
    'DIR_INSERT_QUERY': 'DIR_INSERT_QUERY', //Erro ao inserir diretorio
	'DIR_GET_CONTENT': 'DIR_GET_CONTENT', //Erro ao buscar conteudo de um diretorio
    
    //Erros de gerenciamento de posts
    'POST_FIND_POST': 'POST_FIND_POST', //Erro ao consultar POST por select where path = ?
    'POST_CREATE': 'POST_CREATE', //Erro ao criar post na base de dados
    'POST_UPDATE': 'POST_UPDATE', //Erro ao atualizar post na base de dados
    'POST_UNIQUE_NAME_DUPLICATE': 'POST_UNIQUE_NAME_DUPLICATE', //Unique name ja existe
    'POST_TITLE_DUPLICATE': 'POST_TITLE_DUPLICATE', //Título ja existe
    'POST_PATH_DUPLICATE': 'POST_PATH_DUPLICATE', //Caminho duplicado para o mesmo diretório
    'POST_COUNT_GT_0': 'POST_COUNT_GT_0', //Verificação se existe na base, count maior que 0 = existe
	'POST_FIND_BY_DIRECTORY': 'POST_FIND_BY_DIRECTORY', //Erro na busca de posts por diretorio
	'POST_HOME_MOST_VIEW':'POST_HOME_MOST_VIEW', //Erro ao buscar os posts mais vistos para a home
	'POST_HOME_LATEST':'POST_HOME_LATEST', //Erro ao buscar o post mais novo para a home
    
    
    'UNEXPECTED_ERROR':'UNEXPECTED_ERROR'
};