<script lang="ts">
    import Flex from "../layout/flex.svelte";
    import Grid from "../layout/grid.svelte";
    import { getCalendarLayout } from "./calendarUtils";
    import { Temporal } from "@js-temporal/polyfill";
    import CalendarBlock from "./CalendarBlock.svelte";
    import { setCalendarContext } from "./calendarContext";
    import type { CalendarElementType } from "./calendarTypes";
    import Button from "../Button.svelte";

    const weekDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const currentDate = Temporal.Now.plainDateISO();

    const decrement = () => {
        if($currentMonth === 1)
        {
            $currentMonth = 12
            $currentYear--;
        }
        else
            $currentMonth--;
    }

    const increment = () => {
        if($currentMonth === 12)
        {
            $currentMonth = 1;
            $currentYear++;
        }
        else
            $currentMonth++;
    }

    export let events: Array<CalendarElementType> = [];

    const { currentMonth, currentYear } = setCalendarContext(currentDate.month, currentDate.year, events);

    $: layout = getCalendarLayout($currentMonth, $currentYear);

</script>

<div class="border border-zinc-500/50 bg-zinc-100 rounded-[3px] drop-shadow-lg">
    <section class="py-4">
        <Flex justify={"center"} gap={8} items="center">
            <Button size="tiny" on:click={decrement}>Mois précédant</Button>
            <span class="text-3xl font-bold">{months[$currentMonth - 1]} {$currentYear}</span>
            <Button size="tiny" on:click={increment}>Mois suivant</Button>
        </Flex>
    </section>
    
    <section>
        <Grid cols={7} gap={0}>
            {#each Array.from(Array(7)).map((k, i) => i) as day}
                <div 
                    class="border-b-2 border-t border-t-zinc-500/50 bg-zinc-200 text-zinc-800 text-center p-2 font-semibold capitalize"
                    class:border-r={day < 6}
                    class:border-r-zinc-500={day < 6}
                    class:border-b-violet-500={day <= 4}
                    class:border-b-red-500={day > 4}
                >
                    {weekDays[day]}
                </div>
            {/each}
        </Grid>
    </section>
    
    <section>
        <Grid cols={7} gap={0}>
            {#each Array.from(Array(35)).map((k, i) => i) as block}
                {@const blockDate = layout[block]}
                <CalendarBlock 
                    date={blockDate} todayDate={currentDate} 
                    borderSides={[block >= 7, (block + 1) % 7 != 0, false, false]}
                />
            {/each}
        </Grid>
    </section>
</div>
