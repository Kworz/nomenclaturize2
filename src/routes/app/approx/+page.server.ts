import { Collections, type ArticleMovementsRecord, type OrdersRowsResponse, type OrdersResponse, type SuppliersResponse, type ListResponse } from "$lib/DBTypes";
import type { ArticleResponseExpanded } from "../articles/+page.server";
import type { ListResponseExpanded } from "../lists/+page.server";
import type { Actions, PageServerLoad } from "./$types";

export type OrderRowsResponseExpanded = OrdersRowsResponse<{ article: ArticleResponseExpanded, order: OrdersResponse<{ supplier: SuppliersResponse}> }>;

export type ListResponseCompleteExpand = ListResponse;

export const load = (async ({ locals}) => {

    const order_rows = await locals.pb.collection(Collections.OrdersRows).getFullList<OrderRowsResponseExpanded>({ expand: "article.supplier,order.supplier", filter: `(order.state = "placed" || order.state = "acknowledged") && quantity != quantity_received`});
    const lists = await locals.pb.collection(Collections.List).getFullList<ListResponseExpanded>({ expand: "project,parent_nomenclature,list_row(parent_list),nomenclature_row(parent_list.parent_nomenclature)"});
    const suppliers = await locals.pb.collection(Collections.Suppliers).getFullList<SuppliersResponse>();

    return {
        order_rows: structuredClone(order_rows),
        lists: structuredClone(lists),
        suppliers: structuredClone(suppliers)
    }
}) satisfies PageServerLoad;

export const actions: Actions = {

    receiveArticle: async ({ request, locals }) => {

        try {

            const form = await request.formData();

            const order_row = form.get("order_row")
            const articleID = form.get("article");
            const quantity_received = form.get("received_quantity");

            if(order_row === null)
                throw "Order row id is null";

            if(articleID === null)
                throw "Article ID is null";
            
            if(quantity_received === null)
                throw "Quantity received is null";

            if(locals.user === undefined || locals.user === null)
                throw "User not logged in";

            const order_rows = await locals.pb.collection(Collections.OrdersRows).update<OrdersRowsResponse<{order: OrdersResponse}>>(order_row.toString(), {
                "quantity_received+": quantity_received.toString()
            }, { expand: "order"});

            await locals.pb.collection(Collections.Article).update(articleID.toString(), { "quantity+": quantity_received.toString()});
            
            const movement: ArticleMovementsRecord = {
                article: articleID.toString(),
                quantity_update: Number(quantity_received.toString()),
                user: locals.user.id,
                reason: `R??ception commande ${order_rows.expand?.order.name}`
            };

            await locals.pb.collection(Collections.ArticleMovements).create(movement);
        }
        catch(ex)
        {
            console.log(ex);
            return { receiveArticle: { error: ex }};
        }
    }
};