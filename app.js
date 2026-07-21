$(function() {
    // 1. Todo Model
    var Todo = Backbone.Model.extend({
        defaults: {
            title: '',
            done: false
        },
        toggle: function() {
            this.save({ done: !this.get('done') });
        }
    });

    // 2. Todo Collection (using LocalStorage)
    var TodoList = Backbone.Collection.extend({
        model: Todo,
        localStorage: new Backbone.LocalStorage("backbone-todos")
    });
    var Todos = new TodoList();

    // 3. Individual Todo Item View
    var TodoView = Backbone.View.extend({
        tagName: 'li',
        template: _.template($('#item-template').html()),
        events: {
            "click .toggle": "toggleDone",
            "click .destroy": "clear"
        },
        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
        },
        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },
        toggleDone: function() {
            this.model.toggle();
        },
        clear: function() {
            this.model.destroy();
        }
    });

    // 4. Main Application View
    var AppView = Backbone.View.extend({
        el: $('#todoapp'),
        events: {
            "submit #todo-form": "createTodo"
        },
        initialize: function() {
            this.$input = $('#new-todo');
            this.$list = $('#todo-list');

            this.listenTo(Todos, 'add', this.addOne);
            this.listenTo(Todos, 'reset', this.addAll);

            Todos.fetch(); // Load saved todos from local storage
        },
        addOne: function(todo) {
            var view = new TodoView({ model: todo });
            this.$list.append(view.render().el);
        },
        addAll: function() {
            this.$list.html('');
            Todos.each(this.addOne, this);
        },
        createTodo: function(e) {
            e.preventDefault();
            if (!this.$input.val().trim()) return;

            Todos.create({ title: this.$input.val().trim() });
            this.$input.val('');
        }
    });

    // Initialize the App
    new AppView();
});
