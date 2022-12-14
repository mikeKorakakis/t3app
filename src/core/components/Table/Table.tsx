import {
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  ArrowRightCircleIcon,
} from "@heroicons/react/24/outline";
import {
  Table as ReactTable,
  Column,
  ColumnFiltersState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { AppRouterNames, AppRouterOutputTypes } from "@/server/trpc/router/_app";
import { notify } from "@/utils/notify";
import { trpc } from "@/utils/trpc";
import { useModalStore } from "@/core/stores/modalStore";
import Skeleton from "@/core/components/Layout/Skeleton";

// type GetKeys<U> = U extends Record<infer K, any> ? K : never;

// type UnionToIntersection<U extends object> = {
//   [K in GetKeys<U>]: U extends Record<K, infer T> ? T : never;
// };
// type Transformed = UnionToIntersection<test>



interface Props {
  router: AppRouterNames;
  procedure: "getAll";
  columnMap: Map<unknown, string>;
  EditForm?: (id?: any) => JSX.Element;
  DeleteForm?: (id?: any) => JSX.Element;
}

export default function Home({
  router,
  procedure,
  columnMap,
  EditForm,
  DeleteForm,
}: Props) {
    const { openModal } = useModalStore();
    

  type ProcedureOutput = AppRouterOutputTypes[typeof router][typeof procedure];
  type DataType = ProcedureOutput["data"][0];
//   type DataTypeKeys = UnionToIntersection<DataType>;

  const columnsArray = Array.from(columnMap);

  const columnHelper = createColumnHelper<DataType>();
  const columns = columnsArray.map((innerArr) => {
    const key = innerArr[0] as any// DataTypeKeys | "display";
    const title = innerArr[1] as string;
    if (key === "display") {
      return columnHelper.display({
        id: key,
        cell: () => title,
      });
    } else {
      return columnHelper.accessor(key, {
        id: key.toString(),
        header: () => <span>{title}</span>,
        cell: (info) => {
          const value = info.getValue();
          if (typeof value === "boolean") {
            return (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked={value}
                  className="checkbox m-auto"
                />
              </div>
            );
          } else if (typeof value === "object" && value instanceof Date) {
            return <i>{value.toLocaleString().split(",")[0]}</i>;
          } else if (
            value &&
            typeof value === "object" &&
            value.hasOwnProperty("name")
          ) {
            return <i>{value["name"]}</i>;
          } else if (typeof value === "string" || typeof value === "number") {
            return <i>{value}</i>;
          }
        },
      });
    }
  });

  if (EditForm || DeleteForm) {
    columns.push(
      columnHelper.display({
        id: "edit",
        header: () => {
          return (
            EditForm && (
              <button
                className="btn btn-sm no-underline"
                onClick={() => {
                  openModal(<EditForm />);
                }}
              >
                Create
              </button>
            )
          );
        },
        cell: (info) => {
          return (
            <>
              {EditForm && (
                <button
                  className="link block text-sm text-info no-underline"
                  onClick={() => {
                    openModal(<EditForm id={info.row.original.id} />);
                  }}
                >
                  Edit
                </button>
              )}
              {DeleteForm && (
                <button
                  className="link text-sm text-error no-underline"
                  onClick={() => {
                    openModal(<DeleteForm id={info.row.original.id} />);
                  }}
                >
                  Delete
                </button>
              )}
            </>
          );
        },
      })
    );
  }
  // return columns;
  //   }, [columnMap, columnHelper]);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  //   const rerender = useReducer(() => ({}), {})[1];
  const [sorting, setSorting] = useState<SortingState>([]);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchDataOptions = {
    pageIndex,
    pageSize,
    sorting,
    columnFilters,
  };

  const { isLoading, error, data } = trpc[router][procedure].useQuery(
    fetchDataOptions,
    { keepPreviousData: true }
  );

  useEffect(() => {
    if (error) {
      notify({ message: error.message, type: "error" });
    }
  }, [error]);

  const defaultData = useMemo(() => [], []);

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  const table = useReactTable({
    data: data?.data ?? defaultData,
    pageCount: data?.pageCount ?? -1,
    state: {
      pagination,
      columnFilters,
      globalFilter,
      sorting,
    },
    columns,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    debugTable: true,
    // sortDescFirst: true,
    initialState: {
      sorting: [{ id: "title", desc: true }],
    },
  });

  return (
    <table className="z-0 m-auto table w-fit rounded-3xl shadow-lg">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <th key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder ? null : (
                    <>
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : "",
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: (
                            <ArrowUpCircleIcon className="ml-2 inline w-5" />
                          ),
                          desc: (
                            <ArrowDownCircleIcon className="ml-2 inline w-5" />
                          ),
                        }[header.column.getIsSorted() as string] ??
                          (header.column.getCanSort() ? (
                            <ArrowRightCircleIcon className="ml-2 inline w-5" />
                          ) : null)}
                      </div>
                      <div>
                        {header.column.getCanFilter() ? (
                          <div>
                            <Filter column={header.column} table={table} />
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
      <tbody>
        {isLoading ? (
          <Skeleton />
        ) : (
          table
            .getRowModel()
            .rows.slice(0, pagination.pageSize)
            .map((row) => {
              return (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell, i) => {
                    return i === 0 ? (
                      <th key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </th>
                    ) : (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })
        )}
      </tbody>
      <tfoot className=" rounded-b-3xl">
        <tr className="w-full py-2">
          <th></th>
          <th colSpan={20}>
            <div className="btn-group ml-2  ">
              <button
                className="btn-outline btn border-base-300 bg-base-100"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                ??
              </button>
              <button
                className="btn-outline btn border-base-300 bg-base-100"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                {"<"}
              </button>
              <button className="btn-outline btn border-base-300 bg-base-100">
                {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </button>
              <button
                className="btn-outline btn border-base-300 bg-base-100"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                {">"}
              </button>
              <button
                className="btn-outline btn border-base-300 bg-base-100"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                ??
              </button>
            </div>
            <span className="ml-4  items-center gap-1 ">
              Go to page:
              <input
                type="number"
                defaultValue={table.getState().pagination.pageIndex + 1}
                onChange={(e) => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0;
                  table.setPageIndex(page);
                }}
                className="input-bordered input input-md ml-2 w-20  focus:border-neutral-focus focus:outline-none focus:ring-0  "
              />
            </span>
            <select
              className="select-bordered select ml-4 w-min  focus:border-neutral-focus focus:outline-none focus:ring-0 "
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>
            {/* <div>
                <button onClick={() => rerender()}>Force Rerender</button>
              </div> */}
            {isLoading ? "Loading..." : null}
          </th>
        </tr>
      </tfoot>
    </table>
  );
}

{
  /* <div>{table.getRowModel().rows.length} Rows</div>
<div>
  <button onClick={() => rerender()}>Force Rerender</button>
</div>
<pre>{JSON.stringify(pagination, null, 2)}</pre> */
}
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

function Filter({
  column,
  table,
}: {
  column: Column<any, unknown>;
  table: ReactTable<any>;
}) {
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id);

  const columnFilterValue = column.getFilterValue();

  const sortedUniqueValues = useMemo(
    () =>
      typeof firstValue === "number"
        ? []
        : Array.from(column.getFacetedUniqueValues().keys()).sort(),
    [column, firstValue]
  );

  return typeof firstValue === "number" ? (
    <div>
      <div className="flex space-x-2">
        <DebouncedInput
          type="number"
          min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
          max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
          value={(columnFilterValue as [number, number])?.[0] ?? ""}
          onChange={(value) =>
            column.setFilterValue((old: [number, number]) => [value, old?.[1]])
          }
          placeholder={`Min ${
            column.getFacetedMinMaxValues()?.[0]
              ? `(${column.getFacetedMinMaxValues()?.[0]})`
              : ""
          }`}
          className="input-bordered input input-sm mt-2 focus:border-neutral-focus focus:outline-none focus:ring-0 "
        />
        <DebouncedInput
          type="number"
          min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
          max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
          value={(columnFilterValue as [number, number])?.[1] ?? ""}
          onChange={(value) =>
            column.setFilterValue((old: [number, number]) => [old?.[0], value])
          }
          placeholder={`Max ${
            column.getFacetedMinMaxValues()?.[1]
              ? `(${column.getFacetedMinMaxValues()?.[1]})`
              : ""
          }`}
          className="input-bordered input input-sm mt-2 focus:border-neutral-focus focus:outline-none focus:ring-0 "
        />
      </div>
      <div className="h-1" />
    </div>
  ) : (
    <>
      <datalist id={column.id + "list"}>
        {sortedUniqueValues.slice(0, 5000).map((value: any, i) => (
          <option value={value} key={i} />
        ))}
      </datalist>
      <DebouncedInput
        type="text"
        value={(columnFilterValue ?? "") as string}
        onChange={(value) => column.setFilterValue(value)}
        placeholder={`Search... (${column.getFacetedUniqueValues().size})`}
        className="input-bordered input input-sm mt-2 focus:border-neutral-focus focus:outline-none focus:ring-0 "
        list={column.id + "list"}
      />
      <div className="h-1" />
    </>
  );
}
