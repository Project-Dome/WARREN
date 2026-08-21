/**
 * @NApiVersion 2.1
 */
define([],

    () => {

        return {
            CUSTOM_RECORD: {
                REGISTRO_IMPORTACAO: {
                    ID: "customrecord_sc_pdi_import_record",
                    SUBLIST: "recmachcustrecord_pdi_dtl_import_detail_ls",
                    FIELDS: {
                        USUARIO: "custrecord_pdi_imp_user_ls",
                        ARQUIVO_IMPORTADO: "custrecord_pdi_imp_imported_file_dc",
                        STATUS_INTEGRACAO: "custrecord_pdi_imp_inte_status_ls",
                        STATUS_PREVISAO: "custrecord_pdi_imp_preview_status_ls",
                        STATUS_LANCAMENTO: "custrecord_pdi_imp_journal_status_ls",
                        SUBSIDIARIA: "custrecord_pdi_imp_subsidiary_ls",
                        MENSAGEM_ERRO: "custrecord_pdi_imp_error_msg_ds",
                        NOVO_REGISTRO_IMPORTACAO: "custrecord_pdi_imp_new_import_ls"
                    }
                },
                DETALHE_REGISTRO_IMPORTACAO: {
                    ID: "customrecord_sc_pdi_import_detail",
                    FIELDS: {
                        DATA_REFERENCIA: "custrecord_pdi_dtl_reference_date_ts",
                        NUMERO_LANCAMENTO: "custrecord_pdi_dtl_rele_number_ds",
                        CODIGO_RESUMIDO_1: "custrecord_pdi_dtl_resu_code_one_ds",
                        CODIGO_FORMATADO_1: "custrecord_pdi_dtl_format_code_one_ds",
                        CODIGO_RESUMIDO_2: "custrecord_pdi_dtl_resu_code_two_ds",
                        CODIGO_FORMATADO_2: "custrecord_pdi_dtl_format_code_two_ds",
                        HISTORICO: "custrecord_pdi_dtl_history_ds",
                        SINAL_LANCAMENTO: "custrecord_pdi_dtl_lauch_sign_ds",
                        VALOR_LANCAMENTO: "custrecord_pdi_dtl_lauch_amount_cr",
                        NUMERO_LOTE: "custrecord_pdi_dtl_lote_number_ds",
                        NUMERO_HISTORICO_CONTABIL: "custrecord_pdi_dtl_hist_acc_number_ds",
                        DATA_LANCAMENTO: "custrecord_pdi_dtl_lauch_date_ts",
                        REGISTRO_IMPORTACAO: "custrecord_pdi_dtl_import_detail_ls"
                    }
                },
                CONFIGURACAO: {
                    ID: "customrecord_sc_pdi_config",
                    FIELDS: {
                        PASTA_ARQUIVO_IMPORTADO: "custrecord_pdi_config_default_folder_ds",
                        BTN_CRIAR_PREVIA: "custrecord_pdi_config_btn_preview_ms",
                        BTN_GERAR_LANCAMENTO: "custrecord_pdi_config_btn_journal_ms",
                        BTN_EXCLUIR_LANCAMENTO: "custrecord_pdi_config_btn_del_journal_ms",
                        BTN_REPROCESSAR_PREVIA: "custrecord_pdi_config_reproc_preview_ms",
                        CONTA_PADRAO_ARRENDONDAMENTO: "custrecord_pdi_config_stan_roun_acc_ls",
                        PASTA_ARQUIVO_EXPORTADO: "custrecord_pdi_config_export_folder_ds",
                        COLUM_LANCAMENTO_PADRAO: "custrecord_pdi_config_default_column_ds"
                    }
                },
                PARAMETRO_ALOCACAO: {
                    ID: "customrecord_sc_pdi_allocation_parameter",
                    SUBLIST: "recmachcustrecord_sc_alpl_account",
                    FIELDS: {
                        CONTA_CONTABIL: "custrecord_sc_alp_account",
                        NUMERO_CONTA_CONTABIL: "custrecord_sc_alp_n_acc_ds"
                    }
                },
                DETALHE_PARAMETRO_ALOCACAO: {
                    ID: "customrecord_sc_pdi_alp_list",
                    FIELDS: {
                        CONTA_CONTABIL_ALOCACAO: "custrecord_sc_alpl_account",
                        DEPARTAMENTO: "custrecord_sc_alpl_departament",
                        CENTRO_CUSTO: "custrecord_sc_alpl_class",
                        DESCRICAO_NEGOCIACAO: "custrecord_sc_alpl_description_business",
                        PORCENTAGEM: "custrecord_sc_alpl_percentage"
                    }
                },
                REGISTRO_EXPORTACAO: {
                    ID: "customrecord_sc_pdi_export_record",
                    FIELDS: {
                        DATA_DE: "custrecord_pdi_exp_data_from_ts",
                        DATA_ATE: "custrecord_pdi_exp_data_to_ts",
                        DOCUMENTO: "custrecord_pdi_exp_document_dc",
                        DATA_RELATORIO: "custrecord_pdi_exp_emit_dt_report_ts",
                        NAO_EXPORTAR_ZERADO: "custrecord_pdi_exp_no_export_zero_cb"
                    }
                },
                DETALHE_EXPORTACAO: {
                    ID: "customrecord_sc_pdi_export_detail",
                    SUBLIST: "recmachcustrecord_pdi_dexp_detail_ls",
                    FIELDS: {
                        DETALHE_EXPORTACAO: "custrecord_pdi_dexp_detail_ls",
                        CONTA: "custrecord_pdi_dexp_account_ls",
                        NUMERO_CONTA: "custrecord_pdi_dexp_acc_number_ds",
                        DESCRICAO_CONTA: "custrecord_pdi_dexp_description_ds",
                        VALOR_DEBITO: "custrecord_pdi_dexp_debit_amount_cr",
                        VALOR_CREDITO: "custrecord_pdi_dexp_credit_amount_cr",
                        COLUNA_LANCAMENTO: "custrecord_pdi_dexp_column_ds",
                        CONTA_REDUZIDA: "custrecord_pdi_dexp_reduced_acc_ds"
                    }
                }
            },
            CUSTOM_TRANSACTION: {
                PREVIEW: {
                    ID: "customtransaction_sc_pdi_preview_journal",
                    FIELDS: {
                        REGISTRO_IMPORTACAO: "custbody_sc_pdi_import_detail_preview"
                    }
                },
                JOURNAL: {
                    ID: "customtransaction_sc_pdi_journal_entry",
                    FIELDS: {
                        PREVIEW: "custbody_sc_pdi_preview_journal",
                        REGISTRO_IMPORTACAO: "custbody_sc_pdi_import_detail_journal"
                    }
                }
            },
            LIST: {
                STATUS_IMPORTACAO: {
                    ID: "customlist_sc_pdi_import_status",
                    VALUES: {
                        PENDENTE: 1,
                        EM_ANDAMENTO: 2,
                        CONCLUIDO: 3,
                        ERRO: 4,
                        EXCLUIDO: 5,
                        SUBSTITUIDO: 6
                    }
                }
            }
        }

    });
