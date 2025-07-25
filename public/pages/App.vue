<script>
export default {
  data() {
    return { }
    }
}
</script>

<template>
    <div class="ui fixed menu">
        <div class="ui container">
            <a href="#" class="header item">
            <img class="logo" src="/images/petrobras-8-logo-svg-vector.svg">
            Folha de Horas
            </a>
            <router-link to="/" class="item">Apontamento</router-link>

            <div class="ui simple dropdown item">
                Relatório <i class="dropdown icon"></i>
                <div class="menu">
                    <router-link to="/month-time-report" class="item">Apontamento de Horas</router-link>
                    <router-link to="/facts-and-deliveries-report" class="item">Fatos Relevantes e Entregas</router-link>
                </div>
            </div>
            
            <div class="ui simple dropdown item">
                Administração <i class="dropdown icon"></i>
                <div class="menu">
                    <router-link to="/sap-codes" class="item">Códigos do SAP</router-link>
                    <router-link to="/export" class="item">Exportação (@todo)</router-link>
                    <router-link to="/import" class="item">Importação (@todo)</router-link>
                </div>
            </div>
        </div>
    </div>

    <div class="ui main container">
        <router-view/>
    </div>
</template>
