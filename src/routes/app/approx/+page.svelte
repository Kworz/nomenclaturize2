<script lang="ts">
    import { browser } from "$app/environment";
    import { invalidateAll } from "$app/navigation";
    import Date from "$lib/components/formatters/Date.svelte";
    import Flex from "$lib/components/layout/flex.svelte";
    import Wrapper from "$lib/components/Wrapper.svelte";
    import { Temporal } from "@js-temporal/polyfill";
    import type { ActionData, PageData } from "./$types";
    import ApproxTable from "./ApproxTable.svelte";

    export let data: PageData;
    export let form: ActionData;

    let splitView: "supplier" | "ack_date" = "supplier";

    $: suppliers = [... new Set(data.order_rows.map(k => k.expand?.order.supplier))];
    $: dates = [... new Set(data.order_rows.map(k => k.ack_date))];

    $: suppliersSplittedRows = suppliers.map(k => { return { supplier: k, rows: data.order_rows.filter(j => j.expand?.order.expand?.supplier.id === k)}});
    $: datesSplittedRows = dates.map(k => { return { date: k, rows: data.order_rows.filter(j => j.ack_date === k)}}).sort((a, b) => {
        if(a.date === "") return -1;
        if(b.date === "") return 1;
        return Temporal.PlainDate.compare(Temporal.Instant.from(a.date).toZonedDateTimeISO('UTC').toPlainDate(), Temporal.Instant.from(b.date).toZonedDateTimeISO('UTC').toPlainDate())
    });

    $: if(form !== undefined && browser) { invalidateAll(); }

</script>

<Wrapper>
    <h2>Approvisionement</h2>
    <p>Articles en attente de réception.</p>

    <Flex gap={2}>
        <input type="radio" bind:group={splitView} value="supplier" />
        <span>Tri par fournisseur</span>
    </Flex>
    
    <Flex gap={2}>
        <input type="radio" bind:group={splitView} value="ack_date" />
        <span>Tri par date d'arrivée</span>
    </Flex>
</Wrapper>

{#if splitView === "supplier"}
    {#each suppliersSplittedRows as orderRows}
        <Wrapper class="mt-6">
            <h3>{data.suppliers.find(k => k.id === orderRows.supplier)?.name ?? "Fournisseur introuvable"}</h3>
            <ApproxTable orderRows={orderRows.rows} lists={data.lists} />
        </Wrapper>
    {/each}
{:else}
    {#each datesSplittedRows as orderRows}
        <Wrapper class="mt-6">
            <h3><Date date={orderRows.date} format="long" colorDate={true}/></h3>
            <ApproxTable orderRows={orderRows.rows} lists={data.lists} />
        </Wrapper>
    {/each}
{/if}

