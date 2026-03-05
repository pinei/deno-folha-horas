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
            Timesheet App
            </a>
            <router-link to="/kanban" class="item">Kanban</router-link>
            <router-link to="/" class="item">Timesheet</router-link>

            <div class="ui simple dropdown item">
                Reports <i class="dropdown icon"></i>
                <div class="menu">
                    <router-link to="/month-time-report" class="item">Timesheet Report</router-link>
                    <router-link to="/facts-and-deliveries-report" class="item">Relevant Facts and Deliveries</router-link>
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

    <!-- o Kanban não pode usar `container` pois precisa de todo o espaço horizontal -->
    <div :class="['ui main', $route.path === '/kanban' ? '' : 'container']">
        <router-view/>
    </div>
</template>
