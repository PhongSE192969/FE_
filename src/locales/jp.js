export default {
  common: {
    dashboard: "ダッシュボード",
    logout: "ログアウト",
    language: "言語",
    allFranchise: "全店舗",
  },
  sidebar: {
    Dashboard: "ダッシュボード",
    "Manager Panel": "マネージャーパネル",
    "Admin Panel": "管理者パネル",
    "Staff Portal": "スタッフポータル",
    Franchises: "フランチャイズ",
    Identity: "アイデンティティ",
    Users: "ユーザー",
    "Roles & Permissions": "役割と権限",
    Catalog: "カタログ",
    Products: "製品",
    Categories: "カテゴリー",
    Promotions: "プロモーション",
    Inventories: "在庫",
    Orders: "注文",
    "Customers & Loyalty": "顧客とロイヤルティ",
    Customers: "顧客",
    "Loyalty Programs": "ロイヤルティプログラム",
    "シフトマネージャー": "シフトマネージャー",
    "Shift Manager": "シフトマネージャー",
    Staff: "スタッフ",
    "Shift Management": "シフト管理",
    "Shift Schedule": "シフトスケジュール",
    "AI Settings": "AI設定",
    "My Schedule": "私のスケジュール",
    "Order Management": "注文管理",
    "New Order": "新規注文",
    "New Customer": "新規顧客",
    Loyalty: "ロイヤルティ",
    "Store Requests": "店舗リクエスト",
  },
  orderManagement: {
    title: "全店舗オーダー管理",
    subtitle: "店舗チェーンの全履歴と運営ステータスを追跡",
    statTotal: "総注文数",
    statCompleted: "完了済み",
    statPending: "処理待ち",
    statCancelled: "キャンセル済み",
    searchPlaceholder: "注文IDで検索...",
    columns: ['注文ID', '時間', '店舗', '顧客', 'タイプ', '合計', 'ステータス', ''],
    loading: "読み込み中...",
    empty: "注文がありません",
    guest: "ゲスト",
    defaultType: "デフォルト",
    page: "ページ",
    prev: "前へ",
    next: "次へ",
    statusOptions: [
      { value: "ALL", label: "すべての注文" },
      { value: "WAITING_FOR_CONFIRMATION", label: "支払い待ち" },
      { value: "PREPARING", label: "準備中" },
      { value: "SHIPPING", label: "配達中" },
      { value: "COMPLETED", label: "完了" },
      { value: "CANCELLED", label: "キャンセル" },
      { value: "FAILED_ORDER", label: "注文失敗" },
      { value: "REFUNDED", label: "返金済" }
    ],
    typeOptions: [
      { value: "ALL", label: "すべての種類" },
      { value: "POS", label: "店頭 (POS)" },
      { value: "ONLINE", label: "オンラインデリバリー" }
    ],
    statusBadge: {
      WAITING_FOR_CONFIRMATION: "支払い待ち",
      PREPARING: "準備中",
      SHIPPING: "配達中",
      COMPLETED: "完了",
      CANCELLED: "キャンセル",
      FAILED_ORDER: "注文失敗",
      REFUNDED: "返金済"
    }
  },
  admin: {
    dashboard: {
      title: "ダッシュボード",
      error: "ダッシュボードデータを読み込めませんでした。後でもう一度お試しください。",
      stats: {
        totalRevenue: "総売上",
        totalOrders: "総注文数",
        activeBranches: "稼働中の店舗",
        branchesUnit: "店舗",
        completedOrders: "完了",
        productsUnit: "総商品数:",
        noData: "データなし"
      },
      loading: {
        title: "データを読み込み中...",
        details: "{count} 店舗を読み込みました",
        connecting: "サービスに接続中..."
      },
      retry: "再試行",
      revenueChart: {
        title: "店舗別売上比較",
        periods: {
          thisMonth: "今月",
          lastMonth: "先月",
          thisQuarter: "今四半期",
          thisYear: "今年"
        },
        metrics: {
          revenue: "売上 (百万 VND)",
          orders: "注文数"
        }
      },
      table: {
        title: "店舗別売上",
        branchTitle: "店舗",
        revenueTitle: "売上",
        ordersTitle: "注文数",
        shareTitle: "シェア",
        noData: "注文サービスからの売上データはありません"
      },
      charts: {
        revenueTitle: "店舗別売上チャート",
        noData: "チャートを表示するデータがありません",
        intervals: {
          days7: "過去7日間",
          days30: "過去30日間",
          months3: "過去3ヶ月間",
          years1: "過去1年間"
        },
        revenueByBranch: "店舗別売上",
        revenueDaily: "店舗別日次売上 - ",
        revenueTrend: "時間経過による売上の推移",
        millionVND: " 百万 VND"
      },
      sidebar: {
        topProducts: "売れ筋商品トップ3",
        soldUnit: "販売済み",
        waitingProduct: "商品サービスを待機中...",
        loyalCustomers: "ロイヤルカスタマー",
        ordersUnit: "注文",
        waitingCustomer: "顧客サービスを待機中...",
        noCustomerData: "顧客データなし",
        unitDay: "日",
        unitCustomer: "顧客"
      },
      footer: {
        lastUpdated: "最終更新: "
      }
    },
    customersManagement: {
      title: "顧客管理",
      subtitle: "ファッションコミュニティを理解し、エンゲージする",
      addCustomer: "新規顧客の追加",
      stats: {
        total: "総顧客数",
        registered: "システムに登録済み",
        active: "アクティブユーザー",
        currentlyActive: "現在アクティブ",
        inactive: "非アクティブユーザー",
        needAttention: "対応が必要",
        engagement: "エンゲージメント",
        activeRate: "アクティブ率"
      },
      searchPlaceholder: "名前、メール、電話番号で検索...",
      allStatus: "すべてのステータス",
      active: "アクティブ",
      inactive: "非アクティブ",
      exportData: "データのエクスポート",
      table: {
        info: "顧客情報",
        contact: "連絡先",
        status: "ステータス",
        loading: "顧客を読み込み中...",
        noData: "顧客が見つかりません。"
      },
      confirmDelete: "この顧客を削除してもよろしいですか？",
      deleteFailed: "顧客の削除に失敗しました"
    },
    categoryManagement: {
      title: "カテゴリー管理",
      subtitle: "メニューのために製品を論理的なグループに整理する",
      newCategory: "新規カテゴリー",
      stats: {
        total: "総カテゴリー数",
        departments: "システム部門",
        active: "アクティブ",
        onMenu: "現在メニューに表示中",
        liveProducts: "稼働中の製品",
        totalAcross: "カテゴリー全体の合計",
        inactive: "非アクティブ",
        hidden: "顧客から非表示"
      },
      searchPlaceholder: "カテゴリーを検索...",
      allStatus: "すべてのステータス",
      activeStatus: "アクティブ",
      inactiveStatus: "非アクティブ",
      table: {
        name: "カテゴリー名",
        slug: "スラッグ",
        products: "製品",
        updated: "最終更新",
        status: "ステータス",
        viewProducts: "製品を表示",
        noData: "カテゴリーが見つかりません"
      },
      modals: {
        productsTitle: "カテゴリー内の製品",
        noProducts: "このカテゴリーには製品がありません",
        close: "閉じる"
      },
      confirmDelete: "このカテゴリーを削除しますか？",
      deleteFailed: "削除に失敗しました"
    },
    productManagement: {
      title: "商品管理",
      subtitle: "ファッションを管理する",
      addProduct: "新規商品の追加",
      stats: {
        total: "総商品数",
        unique: "カタログ内の固有アイテム",
        available: "利用可能",
        ready: "販売準備完了",
        lowStock: "在庫少",
        needRestock: "補充が必要なアイテム",
        value: "在庫価値",
        potential: "潜在売上"
      },
      searchPlaceholder: "名前またはSKUで商品を検索...",
      allCategories: "すべてのカテゴリー",
      allStatus: "すべてのステータス",
      table: {
        info: "商品情報",
        category: "カテゴリー",
        price: "価格",
        stock: "在庫",
        status: "ステータス",
        noData: "検索に一致する商品が見つかりませんでした。"
      }
    },
    promotionManagement: {
      title: "プロモーション管理",
      subtitle: "割引とマーケティングキャンペーンを管理する",
      newPromotion: "新規プロモーション",
      stats: {
        total: "総プロモーション数",
        all: "すべてのキャンペーン",
        active: "アクティブ",
        running: "現在実施中",
        inactive: "非アクティブ",
        expired: "期限切れまたは無効"
      },
      searchPlaceholder: "プロモーションを検索...",
      allStatus: "すべてのステータス",
      allPermissions: "すべての権限",
            rank: {
              all: "すべて",
              bronze: "ブロンズ",
              silver: "シルバー",
              gold: "ゴールド",
              platinum: "プラチナ",
              diamond: "ダイヤモンド"
            },
      table: {
        name: "プロモーション名",
        discount: "割引",
        rank: "ランク",
        status: "ステータス",
        updated: "最終更新",
        generate: "コードを生成",
        noData: "プロモーションが見つかりません"
      },
      confirmDelete: "このプロモーションを削除しますか？",
      deleteFailed: "削除に失敗しました"
    },
    inventoryManagement: {
      title: "在庫管理",
      subtitle: "全店舗の商品の監視、承認、および調整",
      tabs: {
        overview: "在庫の概要",
        requests: "入庫リクエスト",
        transfers: "移動注文",
        logs: "取引ログ",
      },
      overview: {
        searchPlaceholder: "商品を検索...",
        filterLowStock: "在庫少をフィルタ",
        filterLowStockActive: "在庫少をフィルタリング中",
        allLocations: "すべての場所",
        mainWarehouse: "メイン倉庫 (システム)",
        mainWarehouseShort: "メイン倉庫",
        branchDefault: "支店",
        statusLow: "在庫少",
        statusSafe: "安全",
      },
      table: {
        product: "商品",
        location: "場所",
        actual: "実在庫",
        reserved: "予約済み",
        available: "利用可能",
        status: "ステータス",
      },
      requests: {
        title: "入庫リクエスト一覧",
        code: "リクエストコード",
        unit: "要求ユニット",
        details: "詳細",
        notes: "メモ",
        actions: "アクション",
        approve: "承認",
        reject: "却下",
        ship: "出荷する",
        insufficientStock: "出荷する在庫が不足しています",
        empty: "リクエストが見つかりません",
        warehouseInfo: "倉庫在庫: {qty}",
        productDefault: "商品",
      },
      transfers: {
        title: "移動注文一覧",
        code: "移動コード",
        route: "ルート",
        status: "ステータス",
        details: "詳細",
        itemsCount: "{count} アイテム",
        empty: "移動注文が見つかりせん",
      },
      logs: {
        title: "取引履歴",
        subtitle: "日付範囲でフィルタ",
        from: "から",
        to: "まで",
        clearFilter: "フィルタをクリア",
        time: "時間",
        product: "商品",
        change: "変動",
        balance: "残高 (前/後)",
        type: "カテゴリ",
        empty: "取引が見つかりません",
        size: "サイズ",
        color: "カラー",
        types: {
          IMPORT: "入庫",
          EXPORT: "出庫",
          TRANSFER: "移動",
          ADJUST: "調整",
        },
      },
      status: {
        pending: "保留中",
        approved: "承認済み",
        shipping: "出荷中",
        shipped: "出荷済み",
        received: "受信済み",
        rejected: "却下",
        completed: "完了",
      },
      actions: {
        importWarehouse: "メイン倉庫への入庫",
        exportTransfer: "出庫 / 移動",
        confirmImport: "入庫を確認",
        confirmExport: "出庫を確認",
        createRequest: "入庫要求を作成",
        submitRequest: "要求を送信",
      },
      modals: {
        approveTitle: "リクエストを承認",
        rejectTitle: "リクエストを却下",
        sourceLabel: "供給元を選択",
        reasonLabel: "却下の理由 (任意)",
        reasonPlaceholder: "理由を入力してください...",
        cancel: "キャンセル",
        confirm: "確認",
        importTitle: "システム倉庫への入庫 (メイン)",
        transferTitle: "出庫 / 移動",
      },
      alerts: {
        lowStockTitle: "警告: 在庫少!",
        lowStockDesc: "アラームレベルのアイテムが {count} 件あります。",
        pendingRequestsTitle: "アクション: リクエストを承認!",
        pendingRequestsDesc: "承認待ちのリクエストが {count} 件あります。",
        viewNow: "今すぐ見る",
        processNow: "今すぐ処理",
        loading: "読み込み中...",
        shipError: "出荷エラー: {error}",
      },
    },
    catalogModal: {
      selectProduct: "製品を選択",
      confirm: "確認",
      successTitle: "操作が成功しました！",
      successDesc: "システムはデータを自動的に同期しています...",
      searchPlaceholder: "製品を検索...",
      noProducts: "このページには製品が見つかりませんでした",
      needImport: "入庫が必要",
      selected: "選択済み",
      exportList: "出庫リスト",
      importList: "入庫リスト",
      itemsCount: "{count} アイテム",
      receivingBranch: "受け取り支店",
      selectBranch: "-- 受け取り支店を選択 --",
      notesPlaceholder: "メモを入力してください (例：今週のイベントの迅速な配送...)",
      emptyList: "リストは空です",
      cancel: "キャンセル",
      selectBranchAlert: "受け取り支店を選択してください！",
      errorOccurred: "エラーが発生しました: ",
      loading: "読み込み中...",
    },
    loyaltyManagement: {
      title: "ティア管理",
      subtitle: "自動ポイントシステム: 10,000 VND = 1 ポイント",
      addTier: "新規ティアの追加",
      table: {
        name: "ティア名",
        points: "必要ポイント",
        benefits: "特典数",
        actions: "アクション",
        loading: "データを読み込み中...",
        noData: "ティアデータがありません。",
        view: "詳細を表示",
        edit: "ティアの編集",
        delete: "ティアの削除"
      },
      modals: {
        addTitle: "新規ティアの追加",
        editTitle: "ティアの編集: {name}",
        nameLabel: "ティア名 (例: SILVER, GOLD)",
        pointsLabel: "必要ポイント (しきい値)",
        benefitsLabel: "特典",
        benefitPlaceholder: "例: すべての注文で5%割引...",
        addBenefit: "特典の追加",
        cancel: "キャンセル",
        create: "作成",
        save: "変更を保存",
        viewTitle: "ティア詳細",
        spendLabel: "消費量:",
        privileges: "ティアの特典",
        noBenefits: "特典はまだ設定されていません。"
      },
      alerts: {
        confirmDelete: "このティアを削除してもよろしいですか？",
        deleteSuccess: "ティアが正常に削除されました",
        deleteFailed: "ティアの削除に失敗しました",
        deleteError: "削除中にエラーが発生しました"
      }
    },
    franchiseManagement: {
      title: "フランチャイズ管理",
      subtitle: "グローバルなコーヒーネットワークの監視と管理",
      addFranchise: "新規フランチャイズの追加",
      stats: {
        total: "総フランチャイズ数",
        active: "アクティブなフランチャイズ",
        inactive: "非アクティブなフランチャイズ",
        new: "新規フランチャイズ"
      },
      searchPlaceholder: "フランチャイズ名で検索...",
      allStatus: "すべてのステータス",
      status: {
        new: "新規",
        active: "アクティブ",
        inactive: "非アクティブ",
        deleted: "削除済み"
      },
      switch: {
        active: "有効",
        inactive: "無効",
        activate: "有効化"
      },
      table: {
        name: "名前",
        address: "住所",
        status: "ステータス",
        actions: "アクション",
        loading: "フランチャイズを読み込み中...",
        loadFailed: "フランチャイズの読み込みに失敗しました",
        loadHelp: "確認：バックエンドサービスは実行されていますか？",
        retry: "再試行",
        view: "表示",
        delete: "削除",
        activate: "有効化",
        deactivate: "無効化",
        noData: "フランチャイズはまだありません。開始するには最初のフランチャイズを作成してください。",
        noMatch: "条件に一致するフランチャイズが見つかりませんでした",
        noAddress: "住所が登録されていません",
        viewOnMap: "地図で見る"
      },
      alerts: {
        createSuccess: "フランチャイズが正常に作成されました",
        updateSuccess: "フランチャイズが正常に更新されました",
        deleteSuccess: "フランチャイズが削除されました",
        deleteActiveError: "アクティブなフランチャイズは削除できません。先に無効化してください。",
        deleteConfirmTitle: "フランチャイズの削除",
        deleteConfirmMessage: "フランチャイズ \"{name}\" を削除してもよろしいですか？この操作は戻せません。",
        noAddress: "地図を表示するための住所がありません",
        statusActive: "ステータスを有効に設定しました",
        statusInactive: "ステータスを無効に設定しました",
        statusNew: "ステータスを新規に設定しました"
      }
    },
    aiSettingsManagement: {
      title: "AI 設定",
      subtitle: "セマンティック検索と推奨システムのパラメータの管理",
      loading: "AI設定を読み込み中...",
      overview: {
        systemStatus: "現在のシステムステータス",
        detailedConfig: "詳細設定",
        semanticWeights: "セマンティックの重み",
        core: "コア",
        desc: "説明",
        active: "有効",
        disabled: "無効",
        hours: "時間",
        none: "なし",
        loading: "読み込み中...",
        syncVector: "ベクトルストアの同期"
      },
      searchWeights: {
        title: "セマンティック検索の重み",
        subtitle: "セマンティック検索の各要素の重みを調整",
        info: "w_core — 名前とカテゴリの重み。\n w_desc — 説明の重み。w_core + w_descの合計は1.0である必要があります。",
        wCoreLabel: "w_core (名前 + カテゴリ)",
        wDescLabel: "w_desc (説明)",
        sumLabel: "合計:",
        updateBtn: "重みの更新"
      },
      schedule: {
        title: "推奨モデルの自動トレーニングスケジュール",
        subtitle: "モデルを周期的に自動再構築",
        autoTrain: "自動トレイン",
        autoTrainDesc: "モデルは以下の周期で自動的に再構築されます",
        interval: "間隔 (時間)",
        intervalLabel: "= {day} 日 {hour} 時間",
        saveBtn: "スケジュールを保存"
      },
      actions: {
        title: "アクションとステータス",
        subtitle: "モデルを手動で再構築するか、ベクトルストアを更新",
        status: {
          model: "モデル",
          ready: "準備完了",
          notTrained: "未トレイン",
          training: "トレーニング中",
          trainingActive: "トレーニング中...",
          idle: "アイドル",
          snapshot: "スナップショット"
        },
        buttons: {
          buildNow: "今すぐ推奨を構築",
          updateVector: "ベクトルストアの更新",
          refresh: "リフレッシュ",
          currentConfig: "現在の設定"
        }
      },
      alerts: {
        loadFailed: "AIサービスからの設定の読み込みに失敗しました",
        invalidWeight: "無効な重み値です",
        weightSum: "重みの合計は1.0でなければなりません",
        updateWeightsSuccess: "重みが正常に更新されました！",
        updateScheduleSuccess: "スケジュールが正常に更新されました！",
        trainStarted: "モデルのトレーニングが開始されました！",
        updateVectorSuccess: "ベクトルストアが正常に更新されました！"
      }
    },
    roleManagement: {
      title: "役割と権限",
      subtitle: "アクセスレベルとセキュリティポリシーの定義",
      managePermissions: "権限の管理",
      createRole: "新規役割の作成",
      stats: {
        totalRoles: "総役割数",
        permissions: "権限",
        avgAccess: "平均アクセス数",
        security: "セキュリティ",
        unlocked: "ロック解除"
      },
      searchPlaceholder: "役割名または説明で検索...",
      filters: "フィルター",
      saveChanges: "変更を保存",
      saveChangesCount: "変更を保存 ({count})",
      saved: "保存済み",
      matrix: {
        title: "アクセスマトリックス",
        subtitle: "グリッドセルを切り替えて権限を役割にマップする",
        header: "役割 \\ 権限"
      },
      alerts: {
        loadFailed: "データの読み込み中にシステムエラーが発生しました",
        createPermissionSuccess: "権限が正常に作成されました！",
        updatePermissionSuccess: "権限が正常に更新されました！",
        deletePermissionSuccess: "権限が正常に削除されました！",
        createRoleSuccess: "役割が正常に作成されました！",
        updateRoleSuccess: "役割が正常に更新されました！",
        deleteRoleSuccess: "役割が正常に削除されました！",
        confirmDeleteRole: "この役割を削除してもよろしいですか？",
        noChanges: "保存する変更はありません。",
        updateMatrixSuccess: "アクセスマトリックスが正常に更新されました！",
        updateMatrixFailed: "マトリックス変更の保存に失敗しました。"
      }
    },
    shiftManagement: {
      title: "シフト管理",
      subtitle: "スタッフの勤務時間の管理と追跡",
      tabs: {
        day: "日",
        week: "週",
        month: "月"
      },
      addShift: "新しいシフトの割り当て",
      stats: {
        total: "総シフト数",
        checkedIn: "勤務中",
        assigned: "割り当て済み",
        absent: "欠勤",
        subtextDay: "日付 {date}",
        subtextWeek: "週 {range}",
        subtextMonth: "月 {month}"
      },
      filters: {
        searchPlaceholder: "スタッフ名で検索...",
        allShifts: "すべてのシフト",
        allStatus: "すべてのステータス",
        shifts: {
          morning: "早番",
          afternoon: "遅番",
          evening: "夜番"
        }
      },
      table: {
        staff: "スタッフ",
        type: "シフトタイプ",
        date: "勤務日",
        time: "時間",
        status: "ステータス",
        actions: "アクション",
        loading: "データを読み込み中...",
        noData: "シフトが見つかりませんでした。",
        late: "· {mins}分遅刻"
      },
      status: {
        ASSIGNED: "割り当て済み",
        CHECKED_IN: "勤務中",
        CHECKED_OUT: "終了",
        ABSENT: "欠勤",
        INCOMPLETE: "チェックアウト忘れ"
      },
      duration: {
        hour: "時間",
        hm: "{h}時間{m}分"
      },
      guide: {
        title: "📋 シフト管理ガイド",
        canChange: "ステータス変更可能:",
        cannotChange: "ステータス変更不可:",
        items: {
          assigned: "割り当て済み → 勤務中 / 欠勤に切り替え",
          checkedIn: "勤務中 → チェックアウトまたは欠勤マーク",
          absent: "欠勤 → 誤りの場合は調整可能",
          checkedOut: "終了 → シフト完了",
          incomplete: "チェックアウト忘れ → 毎日0時に自動実行"
        },
        footer: "⏰ システムは毎日 00:00 に自動的に実行され、勤務中のシフトを「チェックアウト忘れ」に変更します",
        maxShifts: "スタッフ1人あたり週最大6シフト"
      },
      alerts: {
        confirmDelete: "{staff} のシフト \"{shift}\" を削除しますか？",
        updateStatusSuccess: "ステータスが更新されました",
        updateStatusFailed: "更新に失敗しました"
      }
    },
    userManagement: {
      title: "ユーザー管理",
      subtitle: "システムアクセスとスタッフ権限の管理",
      addUser: "新規ユーザーの追加",
      stats: {
        total: "総ユーザー数",
        active: "現在アクティブ",
        admins: "管理者",
        staff: "マネージャー ＆ スタッフ"
      },
      searchPlaceholder: "名前、メール、電話、ユーザー名で検索...",
      filters: {
        allRoles: "全権限",
        allStatus: "すべてのステータス",
        reset: "リセット"
      },
      table: {
        details: "ユーザー詳細",
        role: "役割",
        contact: "連絡先",
        status: "ステータス",
        date: "参加日",
        empty: "フィルターに一致するユーザーが見つかりませんでした。"
      },
      actions: {
        view: "詳細を表示",
        assignRole: "役割の割り当て",
        suspend: "ユーザーの利用停止",
        unlock: "ユーザーの利用再開",
        delete: "ユーザーの削除"
      },
      status: {
        ACTIVE: "アクティブ",
        SUSPENDED: "停止中",
        DELETED: "削除済み",
        INACTIVE: "非アクティブ"
      },
      modals: {
        delete: {
          title: "削除の確認",
          message: "ユーザー {name} を永久に削除してもよろしいですか？この操作は戻せません。",
          cancel: "キャンセル",
          confirm: "削除"
        },
        assign: {
          title: "役割の割り当て",
          message: "{name} の新しい役割を入力または選択してください。",
          save: "役割を保存"
        }
      },
      alerts: {
        deleteSuccess: "ユーザーが正常に削除されました",
        deleteFailed: "ユーザーの削除に失敗しました",
        assignSuccess: "役割が正常に割り当てられました",
        assignFailed: "役割の割り当てに失敗しました"
      }
    },
    storeRequestManagement: {
      title: "店舗リクエスト",
      subtitle: "店舗マネージャーからの補充リクエストを確認・管理",
      refresh: "更新",
      stats: {
        total: "リクエスト合計",
        pending: "審査待ち",
        approved: "承認済み",
        rejected: "却下"
      },
      searchPlaceholder: "リクエストコードまたは顧客IDで検索...",
      allStatus: "すべてのステータス",
      statusPending: "保留中",
      statusApproved: "承認済み",
      statusRejected: "却下",
      table: {
        requestCode: "リクエストコード",
        customer: "顧客",
        franchise: "フランチャイズ",
        date: "日付",
        status: "ステータス",
        actions: "アクション",
        view: "表示",
        approve: "承認",
        reject: "却下",
        noData: "リクエストが見つかりません。"
      },
      detail: {
        title: "リクエスト詳細",
        customerId: "顧客ID",
        franchiseId: "フランチャイズID",
        requestDate: "リクエスト日",
        status: "ステータス",
        notes: "メモ",
        requestedItems: "リクエスト商品",
        totalAmount: "合計金額",
        adminNotes: "管理者メモ",
        reviewedAt: "審査日時",
        close: "閉じる"
      },
      review: {
        approveTitle: "リクエストを承認",
        rejectTitle: "リクエストを却下",
        rejectWarning: "このリクエストを却下すると店舗マネージャーに通知されます。理由をご記入ください。",
        notesLabel: "管理者メモ",
        notesRequired: "（必須）",
        notesOptional: "（任意）",
        approvePlaceholder: "承認済み。在庫はリクエストに応じて更新されます。",
        rejectPlaceholder: "却下理由...",
        cancel: "キャンセル",
        confirmApprove: "承認を確認",
        confirmReject: "却下を確認",
        processing: "処理中..."
      },
      sendRequest: {
        title: "補充リクエストを送信",
        subtitle: "店舗の補充リクエストを作成します",
        createTitle: "新製品を追加",
        editTitle: "要求製品の編集",
        productDetailLabel: "在庫製品の詳細",
        productName: "製品名",
        productNamePlaceholder: "例：アラビカコーヒー豆...",
        imageUrlLabel: "画像URL",
        productId: "製品ID",
        productIdPlaceholder: "製品UUID",
        productCode: "製品コード / SKU",
        skuPlaceholder: "例：SKU-XXXXX",
        category: "カテゴリー",
        categoryPlaceholder: "例：CLOTHING",
        productType: "製品タイプ",
        productTypePlaceholder: "例：MEN",
        size: "サイズ",
        sizePlaceholder: "例：L, XL",
        color: "カラー",
        colorPlaceholder: "例：黒",
        unit: "単位",
        unitPlaceholder: "kg, 袋, リットル...",
        qty: "数量",
        price: "価格",
        pricePlaceholder: "0",
        totalAmount: "合計金額",
        cancel: "キャンセル",
        saveChanges: "変更を保存",
        addItemToList: "リストに追加",
        branch: "店舗 / フランチャイズ",
        items: "要求されたアイテム",
        addItem: "アイテムを追加",
        noItemsAdded: "アイテムが追加されていません",
        notes: "補充ノート",
        notesPlaceholder: "追加のメモ（緊急度、理由など）...",
        send: "リクエストを送信",
        sending: "送信中...",
        successTitle: "リクエスト送信済み！",
        successMessage: "補充リクエストが管理者による審査のために提出されました。",
        totalValueLabel: "リクエストの総価値",
        itemsCountSuffix: "アイテム",
        dateCreatedLabel: "作成日",
        sizeLabel: "サイズ",
        colorLabel: "色",
        defaultSku: "SKU-XXXXX",
        unitSuffix: "単位",
        errorNoItems: "名前と数量を入力した商品を少なくとも1つ追加してください。",
        errorNoBranch: "フランチャイズ / 支店を選択してください。",
        errorFailed: "リクエストの送信に失敗しました。もう一度お試しください。"
      }
    }
  },
  staff: {
    dashboard: {
      welcome: "おはようございます、",
      shiftStarts: "シフト開始 {time}",
      ordersToday: "本日の注文",
      newOrder: "新規注文",
      stats: {
        pending: "保留中",
        preparing: "準備中",
        ready: "準備完了"
      },
      kanban: {
        pending: "🔔 保留中",
        preparing: "⚡ 準備中",
        ready: "✅ 準備完了",
        noOrders: "注文なし",
        accept: "承認して開始",
        markReady: "準備完了に設定",
        complete: "完了"
      },
      performance: {
        title: "本日のパフォーマンス",
        completed: "完了した注文",
        avgPrepTime: "平均準備時間",
        queue: "待ち行列の長さ",
        rating: "評価"
      }
    },
    orderManagement: {
      title: "注文管理",
      subtitle: "すべての注文を表示・管理します",
      refresh: "更新",
      stats: {
        total: "総注文数",
        pending: "保留中",
        preparing: "準備中",
        ready: "準備完了",
        completed: "完了",
        revenue: "売上"
      },
      searchPlaceholder: "注文IDまたは顧客名で検索...",
      filters: {
        all: "すべて",
        pending: "保留中",
        preparing: "準備中",
        ready: "準備完了",
        completed: "完了"
      },
      empty: {
        title: "注文が見つかりませんでした",
        subtitle: "チェックアウト後に注文がここに表示されます"
      },
      table: {
        orderId: "注文ID",
        customer: "顧客",
        items: "商品",
        total: "合計",
        status: "ステータス",
        staff: "スタッフ",
        time: "時間",
        actions: "操作",
        assignStaff: "スタッフを割り当て",
        notAssigned: "未割り当て",
        view: "表示"
      },
      modal: {
        title: "注文詳細",
        items: "注文商品",
        total: "合計",
        updateStatus: "ステータス更新",
        close: "閉じる",
        deleteOrder: "注文を削除",
        generalInfo: "一般情報",
        deliveryInfo: "配送情報",
        address: "配送先住所",
        quantity: "数量",
        subtotal: "小計",
        shipping: "配送料",
        orderType: "注文タイプ",
        paymentId: "決済ID",
        notUpdated: "未更新",
        branch: "店舗",
      }
    },
    myShift: {
      title: "勤務スケジュール",
      loading: "読み込み中...",
      quickInfo: {
        currentShift: "現在のシフト",
        status: "ステータス",
        nextShift: "次のシフト",
        noShift: "シフトなし",
        outOfShift: "勤務時間外",
        viewingDate: "表示日: {date}"
      },
      stats: {
        totalShifts: "総シフト数",
        completed: "完了",
        totalHours: "総労働時間",
        absent: "欠勤",
        last30Days: "過去30日間",
        completedRate: "{rate}% 完了",
        avgHours: "平均 {hours}/日",
        lateCount: "{count} 回の遅刻"
      },
      controls: {
        today: "今日",
        monthView: "月表示",
        listView: "リスト表示",
        monthYear: "{month}月 {year}年"
      },
      calendar: {
        days: ["日", "月", "火", "水", "木", "金", "土"],
        todayBadge: "今日"
      },
      listView: {
        title: "全シフトリスト",
        empty: "割り当てられたシフトはまだありません",
        emptySub: "まもなく割り当てられます！",
        monthYear: "{month}月 {year}年"
      },
      detail: {
        titleToday: "今日のシフト",
        titleDate: "{day} のシフト",
        shiftCount: "{count} シフト",
        emptyToday: "本日はお休みです",
        emptyDate: "この日のシフトはありません",
        emptySubToday: "割り当てられたシフトはありません",
        emptySubDate: "この日のスケジュールはありません"
      },
      status: {
        ASSIGNED: "チェックイン待ち",
        CHECKED_IN: "勤務中",
        CHECKED_OUT: "終了",
        ABSENT: "欠勤",
        INCOMPLETE: "チェックアウト忘れ"
      },
      shifts: {
        morning: "朝番",
        afternoon: "中番",
        evening: "遅番"
      },
      tips: {
        title: "📋 ヒント",
        checkIn: "遅刻を避けるために時間通りに",
        checkOut: "シフト終了時に",
        viewSchedule: "次のシフトに備えてスケジュールを確認する"
      }
    },
    checkout: {
      title: "チェックアウト",
      back: "注文に戻る",
      orderItems: "注文商品",
      itemsCount: "{count} 点",
      qty: "数量: {qty}",
      summary: {
        title: "注文概要",
        subtotal: "小計",
        tax: "税金 (10%)",
        discount: "割引 ({discount}%)",
        totalDue: "合計"
      },
      customer: {
        title: "顧客情報",
        phoneLabel: "電話番号 (任意)",
        placeholder: "電話番号を入力...",
        digitsNeed: "あと {count} 桁必要です",
        autoSearch: "入力時に入力時に自動検索します",
        notFound: "顧客が見つかりませんでした",
        suggestCreate: "新しい顧客プロファイルを作成しますか？",
        createBtn: "新規プロファイルを作成"
      },
      promo: {
        title: "プロモーションコード",
        selectLabel: "割引を選択 (任意)",
        placeholder: "コードを選択...",
        applied: "{discount}% 割引が適用されました"
      },
      payment: {
        title: "お支払い",
        complete: "注文を確定する",
        processing: "処理中..."
      },
      cancel: "キャンセルして戻る"
    },
    createCustomer: {
      title: "新規顧客登録",
      subtitle: "ロイヤルティプログラム用の新しい顧客プロファイルを作成します",
      back: "注文に戻る",
      form: {
        name: "氏名",
        namePlaceholder: "顧客の氏名を入力してください",
        phone: "電話番号",
        phonePlaceholder: "電話番号を入力してください",
        phoneNote: "少なくとも10桁",
        email: "メールアドレス (任意)",
        emailPlaceholder: "customer@example.com",
        note: "💡 注: 新しい顧客は自動的にブロンズティアステータスでロイヤルティプログラムに登録されます。"
      },
      actions: {
        cancel: "キャンセル",
        creating: "作成中...",
        submit: "顧客を作成"
      },
      alerts: {
        fillAll: "必須項目をすべて入力してください",
        phoneLength: "電話番号は少なくとも10桁である必要があります",
        success: "顧客が正常に作成されました！ 🎉",
        error: "顧客の作成中にエラーが発生しました。もう一度お試しください。"
      }
    },
    createOrder: {
      tabs: {
        orderPrefix: "注文 #",
        newOrder: "新規注文"
      },
      search: "商品を検索...",
      categories: {
        all: "すべて"
      },
      empty: {
        noProducts: "商品が見つかりません",
        noItems: "注文に商品がありません",
        addItem: "追加する商品を選択してください"
      },
      cart: {
        title: "現在の注文",
        itemsCount: "{count} 点",
        summary: {
          subtotal: "小計",
          tax: "税金 (10%)",
          total: "合計"
        },
        actions: {
          next: "次へ"
        }
      },
      alerts: {
        loadFailed: "データの読み込みに失敗しました",
        orderCreated: "新規注文が作成されました",
        closeLast: "最後の注文を閉じることはできません",
        closeConfirm: "この注文にはアイテムがあります。本当に閉じますか？",
        closeCancel: "キャンセル",
        closeConfirmBtn: "注文を閉じる",
        orderClosed: "注文が閉じられました",
        added: "{name} が注文に追加されました",
        removed: "アイテムが削除されました",
        addFirst: "最初に注文にアイテムを追加してください"
      }
    },
    options: {
      ice: {
        "Regular Ice": "氷普通",
        "Less Ice": "氷少なめ",
        "No Ice": "氷なし",
        "Extra Ice": "氷多め"
      },
      size: {
        "S": "S",
        "M": "M",
        "L": "L"
      }
    },
    customerManagement: {
      title: "顧客データベース",
      subtitle: "メンバープロファイルとロイヤルティプログラムのステータスを管理します。",
      totalCustomers: "{count} 総顧客数",
      search: {
        keywords: "検索キーワード",
        placeholder: "名前、メール、または電話番号を入力してください...",
        status: "アカウントステータス",
        allStatus: "すべてのステータス",
        submit: "検索"
      },
      table: {
        customerInfo: "顧客情報",
        contact: "連絡先",
        status: "ステータス",
        actions: "アクション",
        empty: "検索条件に一致する顧客が見つかりませんでした。",
        details: "プロファイル詳細"
      },
      pagination: {
        showing: "メンバー {total} 人中 <span class='text-gray-900'>{count}</span> 人を表示"
      },
      modal: {
        title: "メンバープロファイル",
        subtitle: "詳細なアカウントとロイヤルティ情報",
        loading: "データを同期しています...",
        personalInfo: "個人情報",
        labels: {
          name: "氏名",
          phone: "電話番号",
          email: "メールアドレス",
          status: "アカウントステータス"
        },
        loyalty: "ロイヤルティプログラムステータス",
        loyaltyLabels: {
          membership: "メンバーシップステータス",
          member: "{tier} メンバー",
          totalPoints: "合計獲得ポイント",
          availablePoints: "利用可能ポイント"
        },
        emptyLoyalty: "この顧客のアクティブなロイヤルティメンバーシップが見つかりませんでした。",
        close: "プロファイルを閉じる"
      }
    },
    onlineOrder: {
      title: "オンライン注文",
      subtitle: "オンラインでの注文を管理し、スタッフを割り当てます",
      stats: {
        created: "作成済み",
        assigned: "割り当て済み",
        shipping: "配送中",
        delivered: "配達済み",
        failed: "失敗"
      },
      search: "注文IDまたは顧客で検索...",
      statusOptions: {
        all: "すべての注文",
        created: "作成済み",
        assigned: "割り当て済み",
        shipping: "配送中",
        delivered: "配達済み",
        failed: "失敗"
      },
      table: {
        orderId: "注文ID",
        customer: "顧客",
        items: "アイテム",
        total: "合計",
        status: "ステータス",
        staff: "担当スタッフ",
        actions: "アクション",
        empty: "注文が見つかりませんでした",
        emptySub: "フィルターを調整してみてください",
        more: "他 +{count} 点",
        notAssigned: "未割り当て",
        nextStep: "次のステップ",
        failedBtn: "失敗"
      }
    }
  },
  manager: {
    categoryManager: {
      title: "カテゴリ管理",
      subtitle: "製品カテゴリの管理",
      addCategory: "カテゴリを追加",
      stats: {
        total: "総カテゴリ数",
        active: "アクティブ",
        totalItems: "総アイテム数",
        inactive: "非アクティブ"
      },
      search: {
        placeholder: "カテゴリを検索...",
        allStatus: "すべてのステータス",
        active: "アクティブ",
        inactive: "非アクティブ"
      },
      table: {
        category: "カテゴリ",
        slug: "スラッグ",
        items: "アイテム数",
        status: "ステータス",
        actions: "アクション",
        deleteConfirm: "このカテゴリを削除しますか？"
      }
    },
    customerManager: {
      title: "フランチャイズ - 顧客",
      subtitle: "買い物の習慣と顧客ロイヤルティを追跡する",
      addCustomer: "顧客を追加",
      stats: {
        total: "来店顧客",
        totalSub: "フランチャイズデータ",
        vip: "VIP顧客",
        vipSub: "ゴールド＆プラチナティア",
        points: "ロイヤルティポイント",
        pointsSub: "利用可能ポイント合計",
        avgValue: "平均金額",
        avgSub: "請求書あたり"
      },
      search: {
        placeholder: "顧客名または電話番号で検索...",
        allStatus: "すべてのティア"
      },
      table: {
        customer: "顧客",
        tier: "ティア",
        pointsSpent: "ポイント＆使用額",
        status: "ステータス",
        empty: "顧客が見つかりませんでした。",
        spent: "使用済み",
        unknown: "不明",
        deleteConfirm: "この顧客を削除してもよろしいですか？",
        deleteFail: "削除に失敗しました！"
      },
      modal: {
        view: {
          title: "顧客プロファイル",
          points: "現在のポイント",
          spent: "総使用額",
          notUpdated: "未更新",
          close: "プロファイルを閉じる"
        },
        crud: {
          editTitle: "顧客情報の更新",
          createTitle: "新規顧客登録",
          name: "氏名",
          phone: "電話番号",
          tier: "メンバーシップティア",
          email: "メールアドレス",
          cancel: "キャンセル",
          processing: "処理中...",
          confirm: "確認",
          required: "氏名と電話番号は必須です！",
          saveFail: "保存中にエラーが発生しました！"
        }
      }
    },
    inventoryManager: {
      title: "フランチャイズ - 在庫",
      subtitle: "店舗の原材料とサプライ品を管理する",
      actions: {
        history: "在庫履歴",
        restock: "補充"
      },
      stats: {
        total: "総SKU数",
        totalSub: "管理SKU",
        lowStock: "在庫少",
        lowStockSub: "安全レベル未満",
        outOfStock: "在庫切れ",
        outOfStockSub: "緊急補充が必要",
        status: "在庫状態",
        statusSub: "順調に稼働中"
      },
      search: {
        placeholder: "材料名で検索...",
        allStatus: "すべてのステータス",
        inStock: "在庫あり",
        lowStock: "在庫少",
        outOfStock: "在庫切れ"
      },
      table: {
        material: "材料",
        branch: "ブランチ",
        quantity: "現在の数量",
        minStock: "安全レベル",
        status: "ステータス",
        adjustDist: "流通・分配の調整",
        updateLow: "在庫少レベルの更新",
        deleteConfirm: "このアイテムを削除しますか？"
      },
      modal: {
        view: {
          title: "アイテム詳細",
          stock: "現在の在庫",
          lastRestock: "最終補充",
          details: "詳細",
          category: "カテゴリ",
          safeLevel: "安全レベル",
          status: "ステータス",
          close: "ウィンドウを閉じる"
        },
        crud: {
          adjustTitle: "在庫調整",
          restockTitle: "新規補充",
          name: "材料/アイテム名",
          sku: "SKUコード",
          unit: "単位",
          quantity: "{action}の数量",
          adjust: "調整",
          restock: "補充",
          minStock: "安全レベル",
          note: "補充メモ",
          cancel: "キャンセル",
          confirm: "更新の確認"
        },
        reorder: {
          title: "発注レベルの更新",
          cancel: "キャンセル",
          update: "更新"
        }
      },
      alerts: {
        minReorder: "発注レベルは0より大きい必要があります",
        updateSuccess: "閾値が更新されました",
        updateFail: "更新に失敗しました"
      }
    },
    loyaltyReport: {
      title: "ロイヤルティ分析",
      subtitle: "ポイント、トランザクション、およびメンバーシップティアに関する包括的なレポート。",
      refresh: "データを更新",
      error: {
        fetch: "レポートデータの取得に失敗しました。",
        connect: "ロイヤルティサービスに接続できません。"
      },
      stats: {
        earned: "獲得ポイント合計",
        earnedSub: "生涯蓄積",
        redeemed: "利用ポイント合計",
        redeemedSub: "特典に使用",
        earnTxn: "獲得トランザクション",
        earnTxnSub: "総発生回数",
        redeemTxn: "利用トランザクション",
        redeemTxnSub: "総発生回数"
      },
      tierDist: {
        title: "顧客ティア分布",
        subtitle: "現在のロイヤルティステータス別のメンバーの内訳",
        empty: "ティアデータがありません",
        level: "ティアレベル",
        members: "メンバー"
      }
    },
    managerDashboard: {
      stats: {
        revenue: "本日の売上",
        vsYesterday: "+8.2% 前日比",
        orders: "本日の注文数",
        completed: "完了済み",
        pending: "保留中の注文",
        needsAttention: "要対応",
        staff: "勤務中のスタッフ",
        activeNow: "現在アクティブ"
      },
      liveQueue: {
        title: "ライブ注文キュー",
        actions: {
          start: "開始",
          ready: "準備完了",
          complete: "完了"
        }
      },
      staffOverview: {
        title: "勤務中のスタッフ",
        orders: "注文",
        since: "から",
        status: {
          active: "アクティブ",
          break: "休憩中"
        },
        hourly: "本日の時間別注文"
      },
      inventoryAlerts: {
        title: "在庫アラート",
        remaining: "残り",
        orderAction: "注文する"
      }
    },
    managerOrder: {
      title: "フランチャイズ - 注文",
      subtitle: "店舗での注文ステータスの追跡と管理",
      refresh: "更新",
      stats: {
        total: "総注文数",
        completed: "完了",
        pending: "保留中",
        cancelled: "キャンセル済み"
      },
      search: {
        placeholder: "注文IDで検索..."
      },
      status: {
        all: "すべての注文",
        created: "作成済み",
        waiting_payment: "支払い待ち",
        paid: "支払い済み",
        preparing: "準備中",
        ready: "配達中",
        completed: "完了",
        cancelled: "キャンセル",
        failed_order: "注文失敗",
        failed_payment: "支払い失敗",
        refunded: "返金済み"
      },
      table: {
        id: "注文ID",
        time: "時間",
        customer: "顧客",
        type: "タイプ",
        total: "合計金額",
        status: "ステータス",
        empty: "注文が見つかりません",
        loading: "データを読み込み中...",
        guest: "ゲスト",
        defaultType: "デフォルト"
      },
      pagination: {
        page: "ページ",
        prev: "前へ",
        next: "次へ"
      }
    },
    productManager: {
      title: "フランチャイズ - 商品",
      subtitle: "店舗でのメニューと在庫の管理",
      addProduct: "商品を追加",
      stats: {
        total: "総商品数",
        totalSub: "フランチャイズメニュー内",
        active: "販売中",
        activeSub: "提供可能",
        lowStock: "在庫少",
        lowStockSub: "補充が必要",
        outOfStock: "在庫切れ",
        outOfStockSub: "一時停止中"
      },
      search: {
        placeholder: "商品名またはSKUで検索..."
      },
      categories: {
        all: "すべてのカテゴリ",
        coffee: "コーヒー",
        tea: "お茶",
        bakery: "ベーカリー",
        merchandise: "商品"
      },
      status: {
        all: "すべてのステータス",
        active: "販売中",
        out_of_stock: "在庫切れ"
      },
      table: {
        product: "商品情報",
        category: "カテゴリ",
        price: "価格",
        stock: "在庫",
        status: "ステータス",
        unit: "個"
      },
      modalView: {
        title: "商品の詳細",
        price: "価格",
        stock: "在庫あり",
        calories: "栄養成分",
        description: "説明",
        updateStock: "在庫を更新",
        close: "閉じる"
      },
      modalCrud: {
        updateTitle: "商品を更新",
        addTitle: "新商品を追加",
        name: "商品名",
        sku: "SKU",
        category: "カテゴリ",
        price: "価格 ($)",
        stock: "在庫数",
        description: "説明",
        placeholders: {
          name: "例：アラビカコールドブリュー",
          sku: "COF-ACB-01",
          description: "原材料、風味など..."
        },
        cancel: "キャンセル",
        save: "保存"
      }
    },
    promotionManager: {
      title: "プロモーション管理",
      subtitle: "割引とマーケティングキャンペーンの管理",
      addPromotion: "新規プロモーション",
      stats: {
        total: "総プロモーション数",
        totalSub: "すべてのキャンペーン",
        active: "有効",
        activeSub: "現在実行中",
        inactive: "無効",
        inactiveSub: "期限切れまたは無効"
      },
      search: {
        placeholder: "プロモーションを検索..."
      },
      status: {
        all: "すべてのステータス",
        active: "有効",
        inactive: "無効",
        expired: "期限切れ"
      },
      rank: {
              all: "すべて",
              bronze: "ブロンズ",
              silver: "シルバー",
              gold: "ゴールド",
              platinum: "プラチナ",
              diamond: "ダイヤモンド"
            },
      table: {
        name: "プロモーション名",
        discount: "割引",
        rank: "ランク",
        status: "ステータス",
        lastUpdated: "最終更新",
        generateCodes: "コードを生成",
        empty: "プロモーションが見つかりません"
      },
      alerts: {
        deleteConfirm: "このプロモーションを削除しますか？",
        deleteFailed: "削除に失敗しました"
      }
    },
    staffManager: {
      title: "フランチャイズ - スタッフ",
      subtitle: "店舗のチームとシフトスケジュールを管理する",
      addStaff: "スタッフを追加",
      stats: {
        total: "スタッフ総数",
        totalSub: "正社員",
        onDuty: "勤務中",
        onDutySub: "店舗に出勤中",
        onLeave: "休暇中",
        onLeaveSub: "正当な理由あり不在",
        performance: "平均パフォーマンス",
        performanceSub: "月次評価に基づく"
      },
      search: {
        placeholder: "名前またはIDでスタッフを検索...",
        allRoles: "全役職"
      },
      table: {
        staff: "スタッフ",
        role: "役職",
        shift: "シフト",
        contact: "連絡先",
        status: "ステータス"
      },
      status: {
        onDuty: "勤務中",
        leave: "休暇中",
        offDuty: "勤務外"
      },
      modal: {
        view: {
          contactInfo: "連絡先情報",
          joinedDate: "入社日:",
          performance: "今月のパフォーマンス",
          schedulePerms: "スケジュール＆権限",
          currentShift: "現在のシフト",
          access: "アクセスレベル",
          assignShift: "新しいシフトを割り当てる",
          close: "閉じる"
        },
        crud: {
          addTitle: "新規スタッフ登録",
          editTitle: "スタッフ情報の更新",
          name: "氏名",
          phone: "電話番号",
          email: "業務用メール",
          role: "役職",
          shift: "シフト",
          shifts: {
            morning: "早番 (06:00 - 12:00)",
            afternoon: "遅番 (12:00 - 18:00)",
            evening: "夜番 (18:00 - 23:00)",
            fulltime: "フルタイム"
          },
          cancel: "キャンセル",
          confirm: "確認"
        }
      }
    },
    dashboard: {
      stats: {
        revenue: "総売上",
        orders: "総注文数",
        branches: "店舗数"
      },
      table: {
        title: "売上集計表",
        branch: "店舗",
        revenue: "売上",
        orders: "注文数",
        growth: "成長率"
      },
      topProducts: {
        title: "トップ3商品",
        sold: "販売済"
      },
      customers: {
        title: "ロイヤルカスタマー",
        orders: "注文数"
      }
    },
    shiftSchedule: {
      title: "シフトスケジュール",
      subtitle: "スタッフの勤務時間の管理と追跡",
      tabs: {
        day: "日",
        week: "週",
        month: "月"
      },
      addShift: "新しいシフトを割り当てる",
      stats: {
        total: "総シフト数",
        checkedIn: "勤務中",
        assigned: "割り当て済み",
        absent: "欠勤",
        checkedInSub: "出勤スタッフ",
        assignedSub: "チェックイン待ち",
        absentSub: "確認が必要"
      },
      filters: {
        placeholder: "スタッフ名で検索...",
        allShifts: "すべてのシフト",
        allStatus: "すべてのステータス",
        reset: "リセット",
        morning: "朝番",
        afternoon: "中番",
        evening: "遅番",
        filteringBy: "📊 フィルター適用中:"
      },
      table: {
        staff: "スタッフ",
        type: "シフトタイプ",
        date: "勤務日",
        time: "時間",
        status: "ステータス",
        actions: "操作",
        loading: "データを読み込み中...",
        noData: "シフトが見つかりませんでした。",
        late: "· {mins}分遅刻",
        edit: "編集",
        delete: "削除"
      },
      status: {
        ASSIGNED: "割り当て済み",
        CHECKED_IN: "勤務中",
        CHECKED_OUT: "完了",
        ABSENT: "欠勤",
        INCOMPLETE: "チェックアウト忘れ"
      },
      guide: {
        title: "📋 シフト管理ガイド",
        canChange: "ステータスの変更が可能:",
        cannotChange: "ステータスの変更が不可能:",
        items: {
          assigned: "割り当て済み → 勤務中 / 欠勤 に切替可",
          checkedIn: "勤務中 → チェックアウト または 欠勤設定",
          absent: "欠勤 → 誤りがある場合は調整可能",
          checkedOut: "完了 → シフト終了",
          incomplete: "チェックアウト忘れ → 毎日0時に自動設定"
        },
        footer: "⏰ システムは毎日00:00に自動実行され、勤務中のシフトを「チェックアウト忘れ」に変更します",
        maxShifts: "スタッフ1人あたり週最大6シフト"
      },
      modal: {
        titleAdd: "新しいシフトを割り当てる",
        titleEdit: "シフトの更新",
        fields: {
          date: "勤務日",
          type: "シフトタイプ",
          time: "時間",
          startTime: "開始時間",
          endTime: "終了時間",
          branch: "店舗",
          staff: "スタッフ"
        },
        placeholders: {
          loading: "読み込み中...",
          selectStaff: "— スタッフを選択 —"
        },
        warnings: {
          noStaff: "この店舗にはスタッフがいません。",
          selectStaff: "スタッフを選択してください！",
          selectDate: "日付を選択してください！"
        },
        guide: "2ステップ作成：シフト構成の作成 → スタッフの割り当て。デフォルトのステータス：割り当て済み。",
        actions: {
          cancel: "キャンセル",
          confirm: "確認",
          update: "更新",
          processing: "処理中..."
        }
      },
      confirm: {
        cancel: "キャンセル",
        changeStatusTitle: "ステータス変更の確認",
        changeStatusMsg: 'このシフトを「{status}」に変更しますか？',
        changeStatusBtn: '「{status}」に変更',
        deleteTitle: "シフト削除の確認",
        deleteMsg: '{name}の「{shift}」シフトを削除してもよろしいですか？\nこの操作は元に戻せません。',
        deleteBtn: "シフトを削除",
        successDelete: "シフトを削除しました",
        failDelete: "シフトの削除に失敗しました",
        successStatus: "更新しました：{status}",
        failStatus: "更新に失敗しました",
        onlyToday: "シフトの勤務日当日のみステータスを変更できます。",
        notStartedYet: "シフトはまだ始まっていません！{start}まであと{time}です。",
        shiftEnded: '{end}にシフトが終了しました。「{status}」に変更できません。',
        absentCannotReset: "欠勤ステータスを元に戻すことはできません。このシフトはすでに欠勤として記録されています。",
        resetAbsent: "欠勤をキャンセルし、割り当て済みに戻しました",
      }
    }
  },
  customer: {
    nav: {
      menu: "商品",
      locations: "店舗一覧",
      about: "会社概要",
      rewards: "特典",
      searchPlaceholder: "商品を検索...",
      cart: "カート",
      signIn: "ログイン",
      joinUs: "新規登録",
      dashboard: "ダッシュボード",
      logout: "ログアウト",
      myProfile: "マイプロファイル",
      signOut: "サインアウト"
    },
    footer: {
      brandDesc: "Franchise Fashion - スタイルと快適さが出会う場所。私たちのトレンディな衣料品とアクセサリーのコレクションを探索し、あなたの日常のスタイルを高めましょう。",
      reviews: "4.8 · 10,000件以上のレビュー",
      company: "会社情報",
      aboutUs: "会社概要",
      franchise: "フランチャイズ",
      careers: "採用情報",
      press: "プレス",
      support: "サポート",
      helpCenter: "ヘルプセンター",
      contactUs: "お問い合わせ",
      privacyPolicy: "プライバシーポリシー",
      terms: "利用規約",
      rights: "© 2025 Franchise Fashion. 無断複写・転載を禁じます。",
      staffPortal: "スタッフポータル"
    },
    home: {
      hero: {
        newArrival: "新着コレクション",
        title: "ヘリテージ・<br/>モダンスタイル",
        subtitle: "クラシックな伝統と現代的な精神が融合した最新コレクション。あなたの個性を引き立てるためにデザインされました。",
        orderNow: "今すぐ購入",
        viewMenu: "コレクションを見る"
      },
      stats: {
        locations: "全国店舗",
        menuItems: "限定デザイン",
        rating: "顧客満足度"
      },
      orderType: {
        pickup: "店舗受取",
        delivery: "自宅配送"
      },
      featured: {
        subtitle: "最新トレンド",
        title: "アイコニック製品",
        viewAll: "すべて見る"
      },
      whyUs: {
        subtitle: "Capital Fashionを選ぶ理由",
        title: "Capitalのこだわり",
        flavors: {
          title: "最高級の素材",
          desc: "最高級の生地のみを厳選し、快適さと耐久性を両立させています。"
        },
        quick: {
          title: "迅速な配送と調整",
          desc: "スピーディーな配送と、全店舗でのサイズお直しサポートを提供します。"
        },
        rewards: {
          title: "ファッショニスタ特典",
          desc: "ポイントを貯めて会員ランクを上げ、限定ファッションイベントへの招待状を受け取りましょう。"
        }
      },
      bestsellers: {
        subtitle: "お客様のお気に入り",
        title: "ベストセラー",
        fullMenu: "全カタログを見る",
        topSeller: "人気No.1"
      },
      members: {
        title: "VIP会員になる",
        desc: "ファッションコミュニティに参加しましょう。誕生日の特典や限定コレクションへの先行アクセス、特別割引をお楽しみください。",
        joinFree: "無料で登録",
        signIn: "ログイン"
      }
    },
    products: {
      title: "商品カタログ",
      subtitle: "洗練されたデザインと丁寧な仕立てで、常にトレンドをリードします",
      searching: "検索中...",
      searchPlaceholder: "商品、カラー、サイズを検索...",
      sort: {
        popular: "人気順",
        rating: "評価の高い順",
        priceAsc: "価格：安い順",
        priceDesc: "価格：高い順"
      },
      results: "「{query}」の検索結果：{count}件",
      noItems: "該当する商品が見つかりません",
      categories: {
        all: "すべての商品",
        "signature-design": "シグネチャーデザイン",
        "freeze-tea": "アクセサリー＆バッグ",
        "banh-mi-food": "メンズ・レディースウェア",
        "pastries": "ラウンジウェア＆ベーシック"
      },
      soldOut: "在庫切れ",
      added: "追加されました！",
      addToOrder: "カートに入れる",
      toastAdded: "{name}がバッグに追加されました！"
    },
    cart: {
      title: "ショッピングカート",
      clear: "すべてクリア",
      itemsCount: "{count} 点",
      empty: {
        title: "カートは空です",
        subtitle: "商品を追加して始めましょう",
        browse: "メニューを見る"
      },
      item: {
        remove: "削除"
      },
      summary: {
        title: "注文概要",
        subtotal: "小計",
        tax: "消費税 (8%)",
        total: "合計",
        checkout: "レジに進む"
      }
    },
    checkout: {
      title: "ショッピングカート",
      loading: "カートを読み込んでいます...",
      loadingSub: "少々お待ちください",
      header: {
        product: "商品",
        price: "価格",
        quantity: "数量",
        total: "小計"
      },
      actions: {
        selectAll: "すべて選択",
        deleteSelected: "選択したものを削除",
        checkout: "レジに進む",
        delete: "削除"
      },
      summary: {
        total: "合計"
      },
      toasts: {
        selectItems: "商品を選択してください",
        orderSuccess: "注文が完了しました！"
      }
    },
    checkoutInfo: {
      title: "お客様情報",
      form: {
        name: "氏名",
        phone: "電話番号",
        email: "メールアドレス",
        subscribe: "電子メールによる通知とオファーを受け取る"
      },
      orderSummary: {
        title: "商品",
        total: "合計"
      },
      steps: {
        info: "1. 情報",
        payment: "2. お支払い"
      },
      actions: {
        continue: "次へ"
      },
      toasts: {
        fillAll: "すべての情報を入力してください",
        invalidPhone: "電話番号が無効です",
        shippingInfo: "配送情報を入力してください",
        addressSelect: "住所を完全に選択してください",
        addressDetail: "詳細な住所を入力してください",
        orderSuccess: "注文が正常に作成されました",
        orderFailed: "注文の作成に失敗しました"
      }
    },
    checkoutPayment: {
      steps: {
        info: "1. 情報",
        payment: "2. お支払い"
      },
      coupon: {
        placeholder: "クーポンコードを入力（1回のみ有効）",
        apply: "適用"
      },
      summary: {
        title: "注文概要",
        productCount: "商品数",
        subtotal: "商品合計",
        shipping: "配送料",
        discount: "割引",
        total: "合計",
        vat: "税込・端数処理済"
      },
      paymentInfo: {
        title: "お支払い情報"
      },
      delivery: {
        customer: "お客様",
        phone: "電話番号",
        email: "メールアドレス",
        address: "お届け先",
        receiver: "受取人"
      },
      terms: {
        agree: "私は",
        tos: "利用規約",
        and: "および",
        privacy: "プライバシーポリシー"
      },
      footer: {
        total: "合計:",
        pay: "支払う",
        checkItems: "商品リストを確認 ({count})"
      }
    },
    profile: {
      title: "マイプロフィール",
      edit: "編集",
      save: "保存",
      memberSince: "登録日",
      points: "ポイント",
      orders: "注文数",
      totalSpent: "総利用額",
      attributes: {
        fullName: "氏名",
        username: "ユーザー名",
        email: "メールアドレス",
        phone: "電話番号",
        gender: "性別"
      },
      genderOptions: {
        male: "男性",
        female: "女性"
      },
      changePassword: {
        button: "パスワード変更",
        success: "パスワードが正常に更新されました！",
        failed: "パスワードの変更に失敗しました！",
        error: "パスワードの変更中にエラーが発生しました！"
      },
      tabs: {
        orders: "注文履歴",
        points: "ポイント履歴",
        rewards: "リワードプログラム",
        payments: "お支払い方法"
      },
      ordersTab: {
        filters: {
          all: "すべて",
          waiting_for_confirmation: "確認待ち",
          preparing: "準備中",
          shipping: "配送中",
          completed: "完了",
          cancelled: "キャンセル",
          failed_order: "失敗",
          refunded: "返金済み"
        },
        count: "{count} 件の注文",
        viewDetails: "詳細を見る →"
      },
      pointsTab: {
        earn: "注文での獲得",
        redeem: "特典の交換",
        manual: "システム調整",
        fallback: "ポイント取引",
        empty: "取引履歴が見つかりません。"
      },
      rewardsTab: {
        title: "{tier} メンバー",
        benefitsTitle: "あなたの特典:",
        noBenefits: "まだ特定の特典はありません",
        availableRewards: "利用可能なリワード",
        redeem: "{points} pt",
        redeeming: "処理中...",
        empty: "現在利用可能なリワードはありません。"
      },
      toasts: {
        successRedeem: "交換に成功しました！",
        failedRedeem: "交換に失敗しました！",
        successProfile: "プロフィールが更新されました！"
      }
    },
    productDetail: {
      notFound: "商品が見つかりません",
      backToMenu: "メニューに戻る",
      addedToCart: "{qty}点 の {name} をカートに追加しました！",
      reviews: "({count} 件のレビュー)",
      options: {
        size: "サイズ",
        ice: "氷の量",
        sugar: "甘さ"
      },
      addToCart: "カートに追加"
    },
    orderResult: {
      success: {
        title: "注文が完了しました！",
        subtitle: "ご購入いただきありがとうございます。"
      },
      failed: {
        title: "注文に失敗しました！",
        subtitle: "お支払いが完了しませんでした。"
      },
      orderId: "注文ID:",
      status: "お支払い状況:",
      viewOrder: "注文詳細を見る",
      continueShopping: "買い物を続ける",
      backToCheckout: "もう一度試す",
      loading: "読み込み中..."
    },
    orderDetail: {
      loading: "注文を読み込んでいます...",
      notFound: "注文が見つかりません",
      back: "戻る",
      title: "注文 #{id}",
      detailsTitle: "注文詳細",
      orderedAt: "{date} に注文",
      cancelOrder: "注文をキャンセル",
      cancelConfirm: "注文をキャンセル",
      cancelConfirmDesc: "この注文をキャンセルしてもよろしいですか？この操作は取り消せません。",
      close: "閉じる",
      cancelButton: "注文をキャンセル",
      confirmReceipt: "受領確認",
      productList: "商品リスト",
      quantity: "数量: {count}",
      orderStatus: "注文ステータス",
      steps: {
        waiting_for_confirmation: "確認待ち",
        preparing: "準備中",
        shipping: "配送中",
        completed: "完了",
        cancelled: "キャンセル",
        failed_order: "失敗",
        refunded: "返金済み"
      },
      toasts: {
        statusUpdate: "注文ステータス: {status}",
        confirmFailed: "確認に失敗しました！",
        cancelFailed: "キャンセルに失敗しました！"
      },
      customerInfo: {
        title: "お客様情報",
        name: "氏名",
        address: "住所"
      },
      paymentInfo: {
        title: "お支払い情報",
        subtotal: "小計",
        shipping: "配送料",
        free: "無料",
        total: "合計"
      },
      supportInfo: {
        title: "サポート情報"
      }
    },
    loyaltyProfile: {
      title: "ロイヤルティプログラム",
      currentPoints: "現在のポイント:",
      yourBenefits: "あなたの特典:",
      rewards: "リワード",
      ptsRequired: "必要ポイント",
      redeem: "交換する",
      emptyRewards: "現在利用可能なリワードはありません。",
      pointsHistory: "ポイント履歴",
      table: {
        type: "タイプ",
        points: "ポイント",
        description: "説明",
        date: "日付"
      },
      emptyTransactions: "取引履歴が見つかりません。"
    },
    paymentMethods: {
      MOMO: "MoMo ウォレット",
      VNPAY: "VNPay",
      COD: "代金引換 (COD)"
    },
    shippingInfo: {
      title: "配送情報",
      types: {
        store: "店舗受取",
        delivery: "自宅配送"
      },
      store: {
        city: "ホーチミン",
        district: "区・郡を選択",
        address: "店舗住所を選択"
      },
      delivery: {
        name: "受取人名",
        phone: "受取人電話番号",
        province: "都道府県を選択",
        district: "市区町村を選択",
        ward: "町村・大字を選択",
        address: "番地・部屋番号"
      },
      notes: "その他備考"
    }
  },
  modals: {
    addCustomer: {
      title: "新規顧客登録",
      subtitle: "ロイヤルティ＆プロフィール",
      form: {
        name: "氏名",
        phone: "電話番号",
        email: "メールアドレス",
        note: "* 注：システムは自動的に0初期ポイントとBRONZEティアを新規顧客に割り当てます。"
      },
      actions: {
        cancel: "キャンセル",
        register: "顧客登録",
        registering: "登録中..."
      },
      errors: {
        required: "氏名と電話番号は必須です！",
        noFranchise: "どのフランチャイズにも属していません。アクションが拒否されました。",
        failed: "顧客の作成に失敗しました。電話番号/メールが既に存在している可能性があります。"
      }
    },
    addEditProduct: {
      title: {
        update: "製品の更新",
        add: "新規製品の追加"
      },
      subtitle: "在庫",
      form: {
        name: "製品名",
        namePlaceholder: "例：コールドブリューコーヒー",
        brand: "ブランド",
        brandPlaceholder: "例：スターバックス、ブルーボトル...",
        description: "説明",
        descriptionPlaceholder: "この製品の詳細な説明...",
        sku: "SKUコード",
        skuPlaceholder: "SKU-001",
        price: "価格",
        category: "カテゴリー",
        stock: "初期在庫",
        image: "製品画像",
        imageDrop: "画像をドロップするかブラウズ",
        imageSpec: "推奨サイズ：800x800px",
        status: "ステータス",
        statusActive: "有効",
        statusInactive: "無効"
      },
      actions: {
        cancel: "キャンセル",
        save: "変更を保存",
        create: "製品を作成"
      }
    },
    addFranchise: {
      title: "新規フランチャイズパートナー",
      form: {
        branchName: "店舗名",
        branchNamePlaceholder: "例：7区店舗",
        managerName: "マネージャー名",
        managerNamePlaceholder: "氏名",
        address: "所在地住所",
        addressPlaceholder: "番地、通り、都市",
        email: "メールアドレス",
        emailPlaceholder: "manager@example.com",
        phone: "電話番号",
        phonePlaceholder: "+84 ..."
      },
      actions: {
        cancel: "キャンセル",
        register: "フランチャイズを登録"
      }
    },
    addRole: {
      title: "新規役割の定義",
      form: {
        name: "役割名",
        namePlaceholder: "例：在庫スペシャリスト",
        description: "説明",
        descriptionPlaceholder: "この役割ができることを簡単に説明してください"
      },
      actions: {
        cancel: "キャンセル",
        initialize: "役割を初期化"
      }
    },
    addUser: {
      title: "新規ユーザーの作成",
      subtitle: "アクセス制御",
      form: {
        name: "氏名",
        namePlaceholder: "John Doe",
        phone: "電話番号",
        phonePlaceholder: "+84 ...",
        email: "メールアドレス",
        emailPlaceholder: "email@capitalcoffee.com",
        username: "ユーザー名",
        usernamePlaceholder: "johndoe123",
        generateUsername: "ランダムなユーザー名を生成",
        gender: "性別",
        genderOptions: {
          male: "男性",
          female: "女性"
        },
        role: "システム役割",
        branch: "店舗を割り当てる"
      },
      actions: {
        cancel: "キャンセル",
        create: "アカウントを作成"
      }
    },
    categoryAddUpdate: {
      title: {
        edit: "カテゴリーを編集",
        new: "新規カテゴリー"
      },
      subtitle: "カタログ管理",
      form: {
        name: "カテゴリー名",
        namePlaceholder: "例：コールドブリューシリーズ",
        slug: "URLスラッグ",
        slugPlaceholder: "cold-brew-series",
        description: "説明",
        descriptionPlaceholder: "このカテゴリーに含まれる製品の種類を説明してください...",
        status: "表示ステータス",
        statusActive: "有効",
        statusInactive: "無効"
      },
      actions: {
        cancel: "キャンセル",
        saving: "保存中...",
        update: "カテゴリーを更新",
        create: "カテゴリーを作成"
      },
      alerts: {
        required: "カテゴリー名は必須です",
        updated: "カテゴリーが正常に更新されました",
        created: "カテゴリーが正常に作成されました",
        failed: "カテゴリーの保存に失敗しました"
      }
    },
    categoryDetail: {
      itemsLabel: "合計アイテム",
      itemsSuffix: "製品",
      statusLabel: "メニューステータス",
      notesLabel: "カテゴリーノート",
      close: "ウィンドウを閉じる"
    },
    changePassword: {
      title: "パスワード変更",
      description: "アカウントの安全を保つため、長くてランダムなパスワードを使用していることを確認してください。",
      currentPassword: "現在のパスワード",
      newPassword: "新しいパスワード",
      confirmPassword: "新しいパスワードの確認",
      actions: {
        cancel: "キャンセル",
        update: "パスワードを更新"
      }
    },
    confirmDelete: {
      title: "削除の確認",
      message: {
        before: "シフト ",
        after: " を削除してもよろしいですか？この操作は取り消せません。"
      },
      actions: {
        cancel: "キャンセル",
        deleting: "削除中...",
        delete: "削除"
      }
    },
    confirm: {
      actions: {
        cancel: "キャンセル",
        deleting: "削除中...",
        delete: "削除"
      }
    },
    customerDetail: {
      contactDetails: "連絡先と詳細",
      memberSince: "からの会員",
      loyaltySummary: "ロイヤルティ概要",
      points: "ポイント",
      readyRedeem: "特典を引き換える準備ができました",
      spendingInsights: "支出の洞察",
      lifetimeValue: "生涯価値",
      ordersCount: "注文数",
      nextTierProgress: "次のティアの進行状況",
      spendMore: "プラチナに到達するには、さらに 150 ドルを費やす必要があります",
      actions: {
        editProfile: "プロフィールを編集",
        sendPromo: "プロモーションを送信"
      }
    },
    franchiseDetail: {
      title: "フランチャイズ情報",
      subtitle: "店舗レコードの閲覧または変更。",
      form: {
        name: "店舗名",
        address: "所在地",
        status: "現在のステータス",
        statusActive: "営業中",
        statusInactive: "停止中",
        statusNew: "新規パートナー",
        phone: "連絡先電話番号",
        email: "連絡先メール",
        noPhone: "電話番号なし",
        noEmail: "メールなし",
        operatingDates: "運営期間",
        to: "から",
        createdAt: "登録日"
      },
      actions: {
        edit: "プロフィールを編集",
        close: "完了"
      }
    },
    franchiseForm: {
      title: {
        create: "新規パートナー登録",
        edit: "店舗プロフィールの編集"
      },
      subtitle: "統合管理システム",
      form: {
        name: "フランチャイズ名",
        namePlaceholder: "例：第7区支部",
        nameHint: "最低2文字",
        address: "所在地",
        addressPlaceholder: "完全な住所、都市",
        googleMapsUrl: "GoogleマップURL",
        chooseOnMap: "地図から選ぶ",
        googleMapsPlaceholder: "https://www.google.com/maps?q=...",
        phone: "電話番号",
        phonePlaceholder: "例：090 123 4567",
        phoneInvalid: "電話番号は0または+84で始まり、10-11桁である必要があります",
        phoneHint: "0または+84で開始、10-11桁",
        email: "メールアドレス",
        emailPlaceholder: "manager@branch.com",
        emailInvalid: "@とドメインを含む有効なメールアドレスを入力してください",
        emailHint: "形式: example@mail.com",
        status: "システムステータス",
        statusOptions: {
          new: "新規パートナー",
          active: "営業中",
          inactive: "停止中"
        },
        openedDate: "開店日",
        closedDate: "閉店日"
      },
      actions: {
        cancel: "キャンセル",
        create: "登録を確定",
        creating: "処理中...",
        save: "データベースを更新",
        saving: "保存中..."
      }
    },
    generateCoupon: {
      title: "クーポンコードの生成",
      promotionLabel: "プロモーション:",
      form: {
        quantity: "コード数",
        usageLimit: "コードごとの使用制限",
        expiryDate: "有効期限",
        status: "ステータス",
        statusActive: "有効",
        statusInactive: "無効"
      },
      actions: {
        generate: "コードを生成"
      },
      alerts: {
        success: "クーポン生成に成功しました",
        failed: "クーポンの生成に失敗しました"
      }
    },
    managePermission: {
      title: "システム権限",
      subtitle: "機能アクセスポイント",
      topBar: {
        countBefore: "",
        countAfter: " つの権限が定義されています",
        add: "新しい権限を追加"
      },
      empty: "権限が見つかりません。 追加をクリックして作成してください。",
      actions: {
        close: "閉じる"
      },
      confirmDelete: {
        title: "権限を削除しますか？",
        message: {
          before: "権限 ",
          after: " を削除してもよろしいですか？この操作は取り消せません。"
        }
      }
    },
    permissionForm: {
      title: {
        create: "権限の作成",
        edit: "権限の編集"
      },
      form: {
        name: "権限名",
        namePlaceholder: "例：AUTH_MANAGE_USERS",
        api: "API エンドポイント",
        apiPlaceholder: "例：/api/auth/users/**",
        method: "HTTP メソッド",
        description: "説明",
        descriptionPlaceholder: "例：ユーザー詳細の表示を許可する"
      },
      actions: {
        cancel: "キャンセル",
        create: "権限を作成",
        save: "変更を保存"
      }
    },
    promotionDetail: {
      title: "プロモーション詳細",
      table: {
        code: "コード",
        limit: "上限",
        used: "使用済",
        expiry: "期限",
        status: "ステータス",
        empty: "クーポンが見つかりません"
      },
      status: {
        expired: "期限切れ",
        active: "有効",
        inactive: "無効"
      },
      actions: {
        edit: "編集",
        delete: "削除"
      },
      editModal: {
        title: "クーポンの編集",
        usageLimit: "使用制限",
        expiryDate: "有効期限",
        status: "ステータス",
        cancel: "キャンセル",
        save: "保存"
      },
      alerts: {
        updateSuccess: "クーポンが更新されました",
        updateFailed: "更新に失敗しました",
        deleteConfirm: "クーポンを削除しますか？",
        deleteSuccess: "クーポンが削除されました",
        deleteFailed: "削除に失敗しました"
      }
    }
  },
  auth: {
    adminLogin: {
      header: {
        subtitle: "スタッフポータル",
        loginSystem: "アカウントシステムでログイン"
      },
      banner: {
        verifiedSuccess: "メールアドレスの確認が完了しました！",
        canSignIn: "ログインできるようになりました。"
      },
      form: {
        username: "メールアドレスまたはユーザー名",
        password: "パスワード"
      },
      placeholders: {
        username: "メールアドレスまたはユーザー名を入力",
        password: "••••••••"
      },
      actions: {
        signIn: "ログイン",
        backToSite: "← お客様向けサイトに戻る"
      },
      toasts: {
        fillAll: "すべての項目を入力してください",
        invalid: "認証情報が無効です",
        welcome: "おかえりなさい、{name}さん！ ☕",
        verifyFirst: "先にメールアドレスを確認してください",
        failed: "ログインに失敗しました"
      }
    },
    login: {
      banner: {
        verifiedSuccess: "メールアドレスの確認が完了しました！",
        canSignIn: "ログインできるようになりました。"
      },
      welcome: {
        title: "おかえり\nなさい",
        subtitle: "ログインして、注文、特典、パーソナライズされた体験にアクセスしてください。",
        features: {
          track: "リアルタイムで注文を追跡",
          earn: "特典ポイントの獲得と交換",
          save: "お気に入りのカスタマイズを保存"
        }
      },
      form: {
        title: "ログイン",
        noAccount: "アカウントをお持ちでないですか？",
        joinFree: "無料で登録",
        username: "ユーザー名またはメールアドレス",
        password: "パスワード",
        forgotPassword: "パスワードを忘れた方"
      },
      placeholders: {
        username: "ユーザー名またはメールアドレスを入力",
        password: "••••••••"
      },
      actions: {
        signIn: "ログイン",
        loginGoogle: "Googleでログイン"
      },
      footer: {
        isStaff: "スタッフの方ですか？",
        staffPortal: "スタッフポータル →"
      }
    },
    register: {
      welcome: {
        title: "ファミリーに\n参加する",
        subtitle: "無料アカウントを作成して、今日から特典を獲得しましょう。",
        stats: {
          points: "ウェルカムポイント",
          membership: "メンバーシップ",
          birthday: "バースデーボーナス",
          support: "サポート"
        }
      },
      toasts: {
        fillAll: "すべての必須項目を入力してください",
        matchError: "パスワードが一致しません",
        agreeTerms: "利用規約に同意してください",
        pwdSpaces: "パスワードにスペースを含めることはできません",
        usernameFormat: "ユーザー名は英数字とアンダースコアのみ使用できます",
        pwdLength: "パスワードは8文字から64文字である必要があります",
        usernameLength: "ユーザー名は3文字から64文字である必要があります",
        success: "登録が完了しました！メールで確認コードを確認してください。 ☕",
        fixErrors: "以下のエラーを修正してください",
        failed: "登録に失敗しました"
      },
      form: {
        title: "アカウント作成",
        haveAccount: "すでにアカウントをお持ちですか？",
        signIn: "ログイン",
        username: "ユーザー名",
        fullName: "氏名",
        email: "メールアドレス",
        phone: "電話番号",
        gender: "性別",
        password: "パスワード",
        confirmPassword: "パスワードの確認",
        genderOptions: {
          none: "回答しない",
          male: "男性",
          female: "女性"
        },
        strength: {
          weak: "弱い",
          medium: "普通",
          strong: "強い"
        },
        terms: {
          agree: "私は",
          tos: "利用規約",
          and: "および",
          privacy: "プライバシーポリシー"
        }
      },
      actions: {
        createAccount: "アカウントを作成"
      }
    },
    forgotPassword: {
      title: "パスワードを忘れた場合",
      subtitle: "ご心配なく！詳細を入力していただければ、パスワードをリセットするためのOTPをお送りします。",
      toasts: {
        enterIdentifier: "メールアドレスまたはユーザー名を入力してください",
        sendOtpSuccess: "メールにOTPを送信しました",
        sendOtpFailed: "OTPの送信に失敗しました",
        error: "OTPの送信中にエラーが発生しました"
      },
      form: {
        username: "メールアドレスまたはユーザー名"
      },
      placeholders: {
        username: "メールアドレスまたはユーザー名を入力"
      },
      actions: {
        sendOtp: "OTPを送信",
        sending: "送信中...",
        backToSignIn: "ログインに戻る"
      },
      footer: {
        needHelp: "ヘルプが必要ですか？",
        contactSupport: "サポートに連絡"
      }
    },
    confirmPassword: {
      title: "安全なリセット",
      subtitle: "メールに送信されたコードを入力し、強力な新しいパスワードを選択してください。",
      toasts: {
        matchError: "パスワードが一致しません",
        enterOtp: "メールのOTPを入力してください",
        resetSuccess: "パスワードが正常にリセットされました。",
        resetFailed: "パスワードのリセットに失敗しました",
        error: "パスワードのリセット中にエラーが発生しました"
      },
      form: {
        code: "確認コード",
        newPassword: "新しいパスワード",
        confirmPassword: "新しいパスワードの確認"
      },
      actions: {
        resetPassword: "パスワードをリセット",
        resetting: "リセット中...",
        resendCode: "コードを再送信",
        backToSignIn: "ログインに戻る"
      }
    },
    verifyEmail: {
      title: "メールアドレスの確認",
      subtitle1: "6桁の確認コードを送信しました：",
      subtitle2: "アカウントを有効にするには、以下に入力してください。",
      toasts: {
        enterCode: "6桁のコードをすべて入力してください",
        verifySuccess: "メールアドレスが確認されました！Capital Coffeeへようこそ ☕",
        invalidCode: "無効なコードです",
        newCodeSent: "新しいコードがメールに送信されました！",
        resendFailed: "コードの再送信に失敗しました"
      },
      actions: {
        verifyEmail: "メールを確認",
        backToRegister: "← 登録に戻る"
      },
      resend: {
        text: "コードが届きませんか？",
        countdown: "再送信まで"
      }
    }
  },
  ui: {
    pagination: {
      page: "ページ",
      firstPage: "最初のページ",
      lastPage: "最後のページ"
    },
    searchInput: {
      placeholder: "検索..."
    },
    table: {
      emptyMessage: "該当するデータがありません。",
      showHideCols: "列の表示/非表示",
      customizeDisplay: "表示のカスタマイズ"
    }
  },
  components: {
    orderDetailDrawer: {
      title: "注文の詳細",
      generalInfo: "一般情報",
      orderId: "注文ID:",
      date: "日時:",
      branchId: "店舗ID:",
      staffId: "スタッフID:",
      status: "ステータス:",
      customer: "お客様",
      guest: "ゲスト",
      loyaltyPoints: "ロイヤルティポイント:",
      productList: "商品リスト",
      colProduct: "商品",
      colQty: "数量",
      colPrice: "価格",
      colTotal: "合計",
      payment: "支払い",
      totalDue: "合計請求額:",
      shippingPrice: "送料:",
      discount: "割引:",
      finalAmount: "最終金額:",
      paymentMethod: "支払い方法:",
      confirmOrder: "注文を確定",
      cancelOrder: "注文をキャンセル"
    },
    orderTable: {
      loading: "読み込み中...",
      colOrderId: "注文ID",
      colDate: "日時",
      colBranch: "店舗",
      colCustomer: "お客様",
      colTotal: "合計",
      colPayment: "支払い",
      colStatus: "ステータス",
      colAction: "アクション",
      guest: "ゲスト",
      na: "N/A"
    },
    franchiseDetail: {
      title: "フランチャイズ詳細",
      subtitle: "データベースプロファイル",
      form: {
        name: "フランチャイズ名",
        address: "住所",
        status: "ステータス",
        statusActive: "アクティブ",
        statusInactive: "非アクティブ",
        statusNew: "新規",
        phone: "電話番号",
        email: "連絡先メール",
        noPhone: "電話番号が登録されていません",
        noEmail: "メールが登録されていません",
        createdAt: "作成日",
      },
      actions: {
        edit: "フランチャイズを編集",
        close: "閉じる",
      },
    },
    franchiseForm: {
      title: {
        create: "新規パートナーを登録",
        edit: "フランチャイズプロファイルを編集",
      },
      subtitle: "統合管理システム",
      form: {
        name: "フランチャイズ名",
        namePlaceholder: "例：7番街支店",
        nameRequired: "フランチャイズ名は必須です",
        nameTooShort: "名前は2文字以上必要です",
        nameHint: "最低2文字",
        address: "所在地住所",
        addressPlaceholder: "番地、通り名、都市",
        addressRequired: "所在地住所は必須です",
        googleMapsUrl: "Google マップ URL",
        chooseOnMap: "地図で選択",
        googleMapsPlaceholder: "https://www.google.com/maps?q=...",
        googleMapsNote: "Google マップのURLを貼り付けるか地図で選択 — 住所が自動入力されます。",
        phone: "電話番号",
        phonePlaceholder: "例：0901234567",
        phoneRequired: "電話番号は必須です",
        phoneInvalid: "電話番号は0または+84で始まり、10-11桁である必要があります",
        phoneHint: "0または+84で開始、10-11桁",
        email: "メールアドレス",
        emailPlaceholder: "manager@branch.com",
        emailRequired: "メールアドレスは必須です",
        emailInvalid: "@とドメインを含む有効なメールアドレスを入力してください",
        emailHint: "形式: example@mail.com",
        status: "ステータス",
        statusActive: "アクティブ",
        statusInactive: "非アクティブ",
      },
      actions: {
        cancel: "キャンセル",
        creating: "処理中...",
        saving: "保存中...",
        create: "登録を確定",
        save: "変更を保存",
      },
    },
  }
};
